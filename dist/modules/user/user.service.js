"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const enums_1 = require("../../common/enums");
const services_1 = require("../../common/services");
const config_1 = require("../../config/config");
const exception_1 = require("../../common/exception");
const user_reposatory_1 = require("../../DB/repository/user.reposatory");
class UserService {
    redis;
    tokenService;
    s3;
    userRepository;
    constructor() {
        this.redis = services_1.redisService;
        this.tokenService = new services_1.TokenService();
        this.userRepository = new user_reposatory_1.UserRepository();
        this.s3 = services_1.s3Service;
    }
    async profileCoverImages(files, user) {
        const oldurls = user.coverImages;
        const urls = await this.s3.uploadAssets({
            files,
            path: `users/${user._id.toString()}/profile/cover`,
            storageApproach: enums_1.StorageApproachEnum.DISK,
            uploadApproach: enums_1.UploadApproachEnum.SMALL
        });
        user.coverImages = urls;
        await user.save();
        if (oldurls?.length) {
            await this.s3.deleteAssets({
                Keys: oldurls.map(ele => { return { Key: ele }; })
            });
        }
        return user.toJSON();
    }
    async profileImage({ ContentType, OriginalName }, user) {
        const { url, key } = await this.s3.CreatePreSignedUploadLink({
            path: `users/${user._id.toString()}/profile`,
            ContentType,
            OriginalName
        });
        return {
            user: user.toJSON(),
            url
        };
    }
    async profile(user) {
        const data = await this.userRepository.findOne({ options: { populate: [{ path: "friends" }] } });
        return data.toJSON();
    }
    async logout({ flag }, user, { jti, iat, sub }) {
        let status = 200;
        switch (flag) {
            case enums_1.LogOutEnum.ALL:
                user.changeCredentialsTime = new Date();
                await user.save();
                await this.redis.deleteKey(await this.redis.Keys(this.redis.baseRevokeTokenKey(sub)));
                break;
            default:
                await this.tokenService.createRevokeToken({
                    userId: sub,
                    jti,
                    ttl: iat + config_1.REFRESH_TOKEN_EXPIRES_IN
                });
                status = 201;
                break;
        }
        return status;
    }
    ;
    async rotateToken(user, { sub, jti, iat }, issuer) {
        if ((iat + config_1.ACCESS_TOKEN_EXPIRES_IN) * 1000 >= Date.now() + (30000)) {
            throw new exception_1.ConflictExeption("Current access token still valid");
        }
        await this.tokenService.createRevokeToken({
            userId: sub,
            jti,
            ttl: iat + config_1.REFRESH_TOKEN_EXPIRES_IN
        });
        return await this.tokenService.createLoginCredentials(user, issuer);
    }
    ;
    async deleteProfile(user) {
        const account = await this.userRepository.deleteOne({ filter: { _id: user._id, force: true } });
        if (!account.deletedCount) {
            throw new exception_1.NotFoundExeption("Invalid account");
        }
        await this.s3.deleteFolderByPrefix({
            prefix: `users/${user._id.toString()}`
        });
        return account;
    }
}
exports.UserService = UserService;
exports.default = new UserService();
