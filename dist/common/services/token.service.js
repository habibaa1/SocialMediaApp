"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../../config/config");
const enums_1 = require("../enums");
const exception_1 = require("../exception");
const user_reposatory_1 = require("../../DB/repository/user.reposatory");
const redis_service_1 = require("./redis.service");
const model_1 = require("../../DB/model");
const node_crypto_1 = require("node:crypto");
class TokenService {
    userRepository;
    redis;
    constructor() {
        this.userRepository = new user_reposatory_1.UserRepository(model_1.UserModel);
        this.redis = redis_service_1.redisService;
    }
    sign = async ({ payload, secret = config_1.USER_ACCESS_TOKEN_SIGNATURE, options }) => {
        return jsonwebtoken_1.default.sign(payload, secret, options);
    };
    verify = async ({ token, secret = config_1.USER_ACCESS_TOKEN_SIGNATURE, options }) => {
        return jsonwebtoken_1.default.verify(token, secret);
    };
    detectSignatureLevel = async (role) => {
        let signatures;
        switch (role) {
            case enums_1.RoleEnum.ADMIN:
                signatures = {
                    accessSignature: config_1.SYSTEM_ACCESS_TOKEN_SIGNATURE,
                    refreshSignature: config_1.SYSTEM_REFRESH_TOKEN_SIGNATURE,
                };
                break;
            default:
                signatures = {
                    accessSignature: config_1.USER_ACCESS_TOKEN_SIGNATURE,
                    refreshSignature: config_1.USER_REFRESH_TOKEN_SIGNATURE,
                };
                break;
        }
        return signatures;
    };
    getSignature = async (tokenType = enums_1.TokenTypeEnum.ACCESS, signatureLevel) => {
        const signatures = await this.detectSignatureLevel(signatureLevel);
        let signature;
        switch (tokenType) {
            case enums_1.TokenTypeEnum.REFRESH:
                signature = signatures.refreshSignature;
                break;
            default:
                signature = signatures.accessSignature;
                break;
        }
        return signature;
    };
    decodeToken = async ({ token, tokenType = enums_1.TokenTypeEnum.ACCESS }) => {
        const decoded = jsonwebtoken_1.default.decode(token);
        console.log({ decoded });
        if (!decoded?.aud?.length) {
            throw new exception_1.BadRequestExaption("Missing token audience");
        }
        const [tokenApproach, signatureLevel] = decoded.aud;
        console.log({ tokenApproach, signatureLevel });
        if (tokenApproach == undefined || signatureLevel == undefined) {
            throw new exception_1.BadRequestExaption(`missing token audians`);
        }
        if (tokenType != tokenApproach) {
            throw new exception_1.BadRequestExaption(`Invalid token approach only ${tokenType} allowed for this endpoint`);
        }
        if (decoded.jti && await this.redis.get(this.redis.revokeTokenKey({ userId: decoded.sub, jti: decoded.jti }))) {
            throw new exception_1.UnauthorizedExeption("invaled login session");
        }
        const secret = await this.getSignature(tokenApproach, signatureLevel);
        console.log({ secret });
        const verifiedData = await this.verify({ token, secret });
        if (!verifiedData?.sub) {
            throw new exception_1.BadRequestExaption("Invalid token payload");
        }
        const user = await this.userRepository.findOne({
            filter: {
                _id: verifiedData.sub
            }
        });
        if (!user) {
            throw new exception_1.NotFoundExeption("Not register account");
        }
        if (user.changeCredentialsTime && user.changeCredentialsTime?.getTime() >= (decoded.iat || 0) * 1000) {
            throw new exception_1.UnauthorizedExeption("Invalid login session");
        }
        return { user, decoded };
    };
    createLoginCredentials = async (user, issuer) => {
        const { accessSignature, refreshSignature } = await this.detectSignatureLevel(user.role);
        const jwtid = (0, node_crypto_1.randomUUID)();
        const access_token = await this.sign({
            payload: { sub: user._id },
            secret: accessSignature,
            options: {
                issuer,
                audience: [enums_1.TokenTypeEnum.ACCESS, user.role],
                expiresIn: config_1.ACCESS_TOKEN_EXPIRES_IN,
                jwtid
            }
        });
        const refresh_token = await this.sign({
            payload: { sub: user._id },
            secret: refreshSignature,
            options: {
                issuer,
                audience: [enums_1.TokenTypeEnum.REFRESH, user.role],
                expiresIn: config_1.REFRESH_TOKEN_EXPIRES_IN,
                jwtid
            }
        });
        return { access_token, refresh_token };
    };
    createRevokeToken = async ({ userId, jti, ttl }) => {
        await this.redis.set({
            key: this.redis.revokeTokenKey({ userId, jti }),
            value: jti,
            ttl
        });
        return;
    };
}
exports.TokenService = TokenService;
