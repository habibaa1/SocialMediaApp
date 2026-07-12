"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const node_util_1 = require("node:util");
const node_stream_1 = require("node:stream");
const enums_1 = require("../../common/enums");
const services_1 = require("../../common/services");
const exception_1 = require("../../common/exception");
const config_1 = require("../../config/config");
const repository_1 = require("../../DB/repository");
const writePipeLine = (0, node_util_1.promisify)(node_stream_1.pipeline);
class UserService {
    redis;
    tokens;
    s3;
    userRepository;
    constructor() {
        this.redis = services_1.redisService;
        this.tokens = new services_1.TokenService();
        this.s3 = services_1.s3Service;
        this.userRepository = new repository_1.UserRepository();
    }
    async profile(userId) {
        const data = (await this.userRepository.findOne({
            filter: {
                _id: userId,
            },
            options: {
                populate: [{ path: "friends" }],
            },
        }));
        if (!data) {
            throw new exception_1.BadRequestExaption("User not found");
        }
        return data.toJSON();
    }
    async profileImage({ ContentType, originalname, }, user) {
        const { Key, url } = await this.s3.createPreSignedUploadLink({
            path: `users/${user._id.toString()}/profile`,
            ContentType,
            originalname,
        });
        user.profileImage = Key;
        await user.save();
        return { user: user.toJSON(), url };
    }
    async profileCoverImages(files, user) {
        if (!files || files.length === 0) {
            throw new exception_1.BadRequestExaption("No files provided");
        }
        const keys = await this.s3.uploadFiles({
            files,
            path: `users/${user._id.toString()}/cover`,
            storageApproach: enums_1.StorageApproachEnum.DISK,
            uploadApproach: enums_1.UploadApproachEnum.LARGE,
        });
        user.coverImages = keys;
        await user.save();
        return user.toJSON();
    }
    async createPresignedUploadLink({ ContentType, originalname, path, }, user) {
        if (!ContentType || !originalname) {
            throw new exception_1.BadRequestExaption("ContentType and originalname are required");
        }
        const { url, Key } = await this.s3.createPreSignedUploadLink({
            ContentType,
            originalname,
            path: path || `users/${user._id.toString()}/uploads`,
            expiresIn: 3600,
        });
        return { uploadUrl: url, fileKey: Key };
    }
    async streamFile(key) {
        if (!key) {
            throw new exception_1.BadRequestExaption("Missing file key");
        }
        const s3Response = await this.s3.getFile({ Key: key });
        if (!s3Response?.Body) {
            throw new exception_1.BadRequestExaption("File not found or could not be fetched");
        }
        return {
            stream: s3Response.Body,
            ContentType: s3Response.ContentType,
        };
    }
    async pipeFileTo(stream, destination) {
        await writePipeLine(stream, destination);
    }
    async getDownloadUrl(key, downloadName) {
        if (!key) {
            throw new exception_1.BadRequestExaption("Missing file key");
        }
        return this.s3.createPreSignedDownloadLink({
            Key: key,
            expiresIn: 60,
            ...(downloadName && { downloadName }),
        });
    }
    async softDelete(user, { sub }) {
        if (user.$isDeleted()) {
            throw new exception_1.ConflictExeption("Account is already deleted");
        }
        user.$isDeleted(true);
        user.deletedAt = new Date();
        user.changeCredentialsTime = new Date();
        await user.save();
        await this.redis.deleteKey(await this.redis.keys(this.redis.baseRevokeTokenKey(sub)));
    }
    async logout({ flag }, user, { jti, iat, sub }) {
        let status = 200;
        switch (flag) {
            case enums_1.LogOutEnum.ALL:
                user.changeCredentialsTime = new Date();
                await user.save();
                await this.redis.deleteKey(await this.redis.keys(this.redis.baseRevokeTokenKey(sub)));
                break;
            default:
                await this.tokens.createRevokeToken({
                    userId: sub,
                    jti,
                    ttl: Math.max(1, iat + config_1.REFRESH_TOKEN_EXPIRES_IN - Math.floor(Date.now() / 1000)),
                });
                status = 201;
                break;
        }
        return status;
    }
    async rotateToken(user, { jti, iat, sub }, issuer) {
        if ((iat + config_1.ACCESS_TOKEN_EXPIRES_IN) * 1000 >= Date.now() + 30000) {
            throw new exception_1.ConflictExeption("Current access token still valid");
        }
        await this.tokens.createRevokeToken({
            userId: sub,
            jti,
            ttl: Math.max(1, iat + config_1.REFRESH_TOKEN_EXPIRES_IN - Math.floor(Date.now() / 1000)),
        });
        return this.tokens.createLoginCredentials(user, issuer);
    }
}
exports.UserService = UserService;
exports.default = new UserService();
