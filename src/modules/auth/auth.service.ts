// import { HydratedDocument } from "mongoose";
import { BadRequestExaption , ConflictExeption, NotFoundExeption } from "../../common/exception";
import { UserRepository } from "../../DB/repository/user.reposatory";
import { LoginDto, SignupDto ,ConfirmEmailDto ,ResendConfirmEmailDto } from "./auth.dto"
import { IUser } from "../../common/interfaces";
import { compareHash, generateHash } from "../../common/utils/security";
import { emailEvent, emailTemplate, sendEmail } from "../../common/utils/email";
import { NotificationService, redisService, RedisService, TokenService } from "../../common/services";
import { EmailEnum, ProviderEnum } from "../../common/enums";
import { createRandomOtp } from "../../common/utils/otp";
import { ILoginRessponse } from "./auth.entities";
import { OAuth2Client, TokenPayload } from "google-auth-library";
import { CLIENT_IDS } from "../../config/config";
import {notificationService} from "../../common/services/notfication.service"
// import { SecurityService } from "../../common/services";
// import { ISignupResspones } from "./auth.entities"
// import { ApplicationExaption } from "../../common/exception"
export class AuthnticationService {

    private readonly userRepository: UserRepository
    private readonly redis:RedisService
    private readonly tokenService:TokenService
    private readonly notificationService : NotificationService

    // private readonly securityService: SecurityService
    constructor() {
            this.userRepository = new UserRepository()
            this.tokenService= new TokenService()
            this.redis = redisService
            this.notificationService = notificationService
            // this.securityService = new SecurityService()

    }
// public login(data: any): string{

//     throw new ApplicationExaption("not implemented yet ", 400 ,{cause :{extra:"lol"}})

// }
public async login({email, password , FCM}:LoginDto,issuer:string) :Promise<ILoginRessponse> {
    // const {email,password} = inputs;

    const user = await this.userRepository.findOne({
        filter:{
            email,
            provider:ProviderEnum.SYSTEM,
            confirmEmail:{$exists:true}
        },
    });
    if(!user){
        throw new NotFoundExeption("invalid login credentials")
    }
    if(! await compareHash({plaintext:password,ciphertext: user.password})){
        throw new NotFoundExeption("invaled login credentials")
    }
    if (FCM) {

    await this.redis.addFCM(user._id, FCM)
    const tokens = await this.redis.getFCMs(user._id);
    if (tokens?.length){
        await this.notificationService.sendNotifications({
            tokens,
            data:{
                title: "Login Notification",
                body: `You have logged in successfully at ${new Date()}`
            }
        })
    }
    }

    return await this.tokenService.createLoginCredentials(user,issuer)
}
private async sendEmailOtp ({email,subject, title}:{email:string,subject:EmailEnum,title:string}) {
        const isBlockedTTL = await this.redis.ttl (this.redis.blockOtpKey({email , subject}))
        if (isBlockedTTL > 0){
            throw new BadRequestExaption(`sorry we cannot request new otp while are blocked please try again after ${isBlockedTTL}`)
        }
        const remainingOtpTTL = await this.redis.ttl(this.redis.otpKey({email,subject}))
                if (remainingOtpTTL > 0){
            throw new BadRequestExaption(`sorry we cannot request new otp while are blocked please try again after ${remainingOtpTTL}`)
        }
        const maxtrial = await this.redis.get(this.redis.maxAttemptOtpKey({email,subject}))
        if (maxtrial >= 3){
            await this.redis.set({
                key:this.redis.blockOtpKey({email,subject}),
                value:1,
                ttl:7*60
            })
            throw new BadRequestExaption(`you have reached the max trial`)

        }
        const code = createRandomOtp()
        await this.redis.set({
            key:this.redis.otpKey({email,subject}),
            value:await generateHash({plaintext: `${code}`}),
            ttl:120
        })
        emailEvent.emit("sendEmail", async()=>{
            await sendEmail({
                to:email,
                subject,
                html:emailTemplate({code,title})
            })
            await this.redis.incr(this.redis.maxAttemptOtpKey({email,subject}))
        })
    }
    public async signup ({email , username ,password, phone}: SignupDto): Promise<IUser>{
        // let {username, email, password} = data 
        // console.log({username, email, password});
        // const user = await UserModel.create({
        //     username,
        //     email,  
        //     password

        // })
        const checkUserExist = await this.userRepository.findOne({
            filter:{email},
            projection:"email",
            options:{lean:false}
        })
        console.log({checkUserExist});
        if(checkUserExist){
            // checkUserExist.email="test";
            // await checkUserExist.save()
            throw new ConflictExeption("email already exist")
        }
        const user = await this.userRepository.createOne({
            data:{
                email,
                username,  
                password,
                phone :phone as string
            }
        }) 
        if (!user){
            throw new BadRequestExaption("failed to create user")

        }
        this.sendEmailOtp({email,subject: EmailEnum.Confirm_Email,title:"verify Email"})
        return user.toJSON()
    }
///////////////////////////////////
    public async confirmEmail ( { email, otp }:ConfirmEmailDto) {

    const hashOtp = await this.redis.get(this.redis.otpKey({ email, subject: EmailEnum.Confirm_Email }))
    if (!hashOtp) {
        throw new NotFoundExeption("Expired otp" )
    }

    const account = await this.userRepository.findOne({
        filter: { email, confirmEmail: { $exists: false }, provider: ProviderEnum.SYSTEM }
    })
    if (!account) {
        throw new NotFoundExeption( "Fail to find matching account" )
    }

    if (!await compareHash({ plaintext: otp, ciphertext: hashOtp })) {
        throw new ConflictExeption( "Invalid otp" )
    }
(account as any).confirmEmail = new Date();    await account.save()

    await this.redis.deleteKey(await this.redis.Keys(this.redis.otpKey({ email })))
    
    return;
};

public async resendConfirmEmail ({email}:ResendConfirmEmailDto)  {

    const account = await this.userRepository.findOne({
        filter: { email, confirmEmail: { $exists: false }, provider: ProviderEnum.SYSTEM }
    })

    if (!account) {
        throw new NotFoundExeption("Fail to find matching account" )
    }

    await this.sendEmailOtp({ email, subject: EmailEnum.Confirm_Email, title: "Verify Email" })

    return;
};

private async verifyGoogleAccount (idToken:string):Promise<TokenPayload> {
    const client = new OAuth2Client();

    const ticket = await client.verifyIdToken({
        idToken,
        audience:CLIENT_IDS,
    });

    const payload = ticket.getPayload();

    if (!payload?.email_verified) {
        throw new BadRequestExaption ( "Invalid token payload" );
    }

    return payload;
};
async loginWithGmail  (idToken:string, issuer:string)  {
    const payload = await this.verifyGoogleAccount(idToken);

    const user = await this.userRepository.findOne({
        filter: {
            email: payload.email as string,
            provider: ProviderEnum.GOOGLE
        }
    });

    if (!user) {
        throw new NotFoundExeption("Invalid account provider or not register account" );
    }

    return await this.tokenService.createLoginCredentials(user, issuer);
};
async signupWithGmail (idToken:string, issuer:string) {
    const payload = await this.verifyGoogleAccount(idToken);

    const checkExist = await this.userRepository.findOne({
        filter: {
            email: payload.email as string
        }
    });

    console.log({ checkExist });

    if (checkExist) {
        if (checkExist.provider !== ProviderEnum.GOOGLE) {
            throw new ConflictExeption( "Invalid account provider");
        }
        return { status: 200, credentials: await this.loginWithGmail(idToken, issuer) };
    }

    const account = await this.userRepository.createOne({
        data: {
            firstName: payload.given_name as string,
            lastName: payload.family_name as string,
            email: payload.email as string,
            profileImage: payload.picture as string,
            confirmEmail: new Date(), 
            provider: ProviderEnum.GOOGLE
        }
    });

    return { status: 201, credentials: await this.tokenService.createLoginCredentials(account, issuer) };
};

public async requestForgotPasswordOtp(inputs: ResendConfirmEmailDto): Promise<void> {
        const { email } = inputs;

        const account = await this.userRepository.findOne({
            filter: {
                email,
                confirmEmail: { $exists: true },
                provider: ProviderEnum.SYSTEM
            }
        });

        if (!account) {
            throw new NotFoundExeption("Fail to find matching account");
        }

        await this.sendEmailOtp({ 
            email, 
            subject: EmailEnum.Forgot_Password, 
            title: "Reset Code" 
        });
    }


public async verifyForgotPasswordOtp({ email, otp }: ConfirmEmailDto): Promise<void> {
        const hashOtp = await this.redis.get(this.redis.otpKey({ email, subject: EmailEnum.Forgot_Password }));
        
        if (!hashOtp) {
            throw new NotFoundExeption("Expired or invalid otp");
        }

        if (!await compareHash({ plaintext: otp, ciphertext: hashOtp })) {
            throw new ConflictExeption("Invalid otp");
        }

    }


public async resetForgotPasswordOtp(inputs: any): Promise<void> {
        const { email, otp, password } = inputs;

        const hashOtp = await this.redis.get(this.redis.otpKey({ email, subject: EmailEnum.Forgot_Password }));
        if (!hashOtp || !await compareHash({ plaintext: otp, ciphertext: hashOtp })) {
            throw new ConflictExeption("Invalid or expired otp process");
        }

        const hashedPassword = await generateHash({ plaintext: password });

        const account = await this.userRepository.findOneAndUpdate({
            filter: { email, provider: ProviderEnum.SYSTEM },
            update: { password: hashedPassword },
            options: {} as any
        });

        if (!account) {
            throw new NotFoundExeption("Fail to update password");
        }

        await this.redis.deleteKey(this.redis.otpKey({ email, subject: EmailEnum.Forgot_Password }));
    }

} 

export default new AuthnticationService()