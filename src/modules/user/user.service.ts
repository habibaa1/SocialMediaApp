
import { HydratedDocument } from "mongoose";
import { IUser } from "../../common/interfaces";
import { LogOutEnum, StorageApproachEnum, UploadApproachEnum} from "../../common/enums";
import { redisService, RedisService, s3Service, S3Service, TokenService } from "../../common/services";
import { ACCESS_TOKEN_EXPIRES_IN, REFRESH_TOKEN_EXPIRES_IN } from "../../config/config";
import { ConflictExeption, NotFoundExeption } from "../../common/exception";
import { UserRepository } from "../../DB/repository/user.reposatory";



export class UserService{
    private readonly redis:RedisService
    private readonly tokenService:TokenService
    private readonly s3:S3Service
    private readonly userRepository:UserRepository
    constructor(){
        this.redis=redisService
        this.tokenService = new TokenService();
        this.userRepository = new UserRepository()
        this.s3 = s3Service
    }
    async profileCoverImages(files:Express.Multer.File[], user:HydratedDocument<IUser>){
        const oldurls = user.coverImages
        const urls = await this.s3.uploadAssets({
            files, 
            path:`users/${user._id.toString()}/profile/cover`,
            storageApproach:StorageApproachEnum.DISK,
            uploadApproach: UploadApproachEnum.SMALL
        })
        // console.log({result});
        user.coverImages = urls
        await user.save()    
        if(oldurls?.length){
            await this.s3.deleteAssets({
                Keys: oldurls.map(ele => {return { Key: ele }})
            })
        }

        return user.toJSON()
    }


    async profileImage({ContentType , OriginalName}:{ContentType: string, OriginalName: string}, user:HydratedDocument<IUser>):Promise<{user:IUser, url:string}>{
        // const oldpic = user.profileImage
        const {url,key} = await this.s3.CreatePreSignedUploadLink({
            path:`users/${user._id.toString()}/profile`,
            ContentType,
            OriginalName
        })
        // console.log({result});
        // user.profileImage = key as string
        //  await user.save()    
        // if (oldpic) {
        //     await this.s3.deleteAsset({ Key: oldpic })
        // }
return { 
        user: user.toJSON(), 
        url 
    };
}
    async profile(user:HydratedDocument<IUser>):Promise<any>{
        const data = await this.userRepository.findOne({options:{populate:[{path:"friends"}]}} ) as HydratedDocument<IUser>
        return data.toJSON()
    }
    async logout  ({ flag }:{flag:LogOutEnum}, user:HydratedDocument<IUser>, { jti, iat, sub }:{jti:string,iat:number,sub:string}):Promise<number> {
    let status = 200;

    switch (flag) {
        case LogOutEnum.ALL:
            user.changeCredentialsTime = new Date();
            await user.save();
            
            await this.redis.deleteKey(await this.redis.Keys(this.redis.baseRevokeTokenKey(sub)));
            break;

        default:
            await this.tokenService.createRevokeToken({
                userId: sub,
                jti,
                ttl: iat + REFRESH_TOKEN_EXPIRES_IN
            });
            status = 201;
            break;
    }

    return status;
};
async rotateToken  (user:HydratedDocument<IUser>, { sub, jti, iat }:{jti:string,iat:number,sub:string}, issuer:string) {
    if ((iat + ACCESS_TOKEN_EXPIRES_IN) * 1000 >= Date.now() + (30000)) {
        throw new ConflictExeption( "Current access token still valid" );
    }

    await  this.tokenService.createRevokeToken({
        userId: sub,
        jti,
        ttl: iat + REFRESH_TOKEN_EXPIRES_IN
    });

    return await this.tokenService.createLoginCredentials(user, issuer);
};

async deleteProfile(user: HydratedDocument<IUser>) {

    const account = await this.userRepository.deleteOne({ filter: { _id: user._id , force: true } });
    
    if (!account.deletedCount) {
        throw new NotFoundExeption ("Invalid account");
    }
    await this.s3.deleteFolderByPrefix({
        prefix: `users/${user._id.toString()}`});
    return account
}
}
export default new UserService() 