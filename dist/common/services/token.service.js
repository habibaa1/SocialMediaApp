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
const redis_service_1 = require("./redis.service");
const repository_1 = require("../../DB/repository");
const crypto_1 = require("crypto");
class TokenService {
    userRepository;
    redis;
    constructor() {
        this.userRepository = new repository_1.UserRepository();
        this.redis = redis_service_1.redisService;
    }
    sign = async ({ payload, secret = config_1.User_TOKEN_SECRET_KEY, options, }) => {
        return jsonwebtoken_1.default.sign(payload, secret, options);
    };
    verify = async ({ token, secret = config_1.User_TOKEN_SECRET_KEY, options, }) => {
        return jsonwebtoken_1.default.verify(token, secret);
    };
    detectSignatureLevel = async (role) => {
        let signatureLevel;
        switch (role) {
            case enums_1.RoleEnum.ADMIN:
                signatureLevel = {
                    accessSignature: config_1.System_TOKEN_SECRET_KEY,
                    refreshSignature: config_1.System_REFRESH_TOKEN_SECRET_KEY,
                };
                break;
            default:
                signatureLevel = {
                    accessSignature: config_1.User_TOKEN_SECRET_KEY,
                    refreshSignature: config_1.User_REFRESH_TOKEN_SECRET_KEY,
                };
                break;
        }
        return signatureLevel;
    };
    getSignature = async (tokenType = enums_1.TokenTypeEnum.ACCESS, signatureLevel) => {
        const signatures = await this.detectSignatureLevel(signatureLevel);
        switch (tokenType) {
            case enums_1.TokenTypeEnum.ACCESS:
                return signatures.accessSignature;
            case enums_1.TokenTypeEnum.REFRESH:
                return signatures.refreshSignature;
            default:
                throw new exception_1.BadRequestExaption("Invalid token type");
        }
    };
    decodeToken = async ({ token, tokenType = enums_1.TokenTypeEnum.ACCESS, }) => {
        const decoded = jsonwebtoken_1.default.decode(token);
        if (!decoded) {
            throw new exception_1.BadRequestExaption("Invalid token");
        }
        if (!Array.isArray(decoded.aud)) {
            throw new exception_1.BadRequestExaption("Invalid token audience format");
        }
        const [tokenApproach, signatureLevel] = decoded.aud;
        if (tokenApproach === undefined || signatureLevel === undefined) {
            throw new exception_1.BadRequestExaption("Invalid token audience format");
        }
        const parsedTokenType = Number(tokenApproach);
        if ((parsedTokenType !== enums_1.TokenTypeEnum.ACCESS &&
            parsedTokenType !== enums_1.TokenTypeEnum.REFRESH) ||
            (signatureLevel !== enums_1.RoleEnum.ADMIN && signatureLevel !== enums_1.RoleEnum.USER)) {
            throw new exception_1.BadRequestExaption("Invalid token audience format");
        }
        if (tokenType !== parsedTokenType) {
            throw new exception_1.BadRequestExaption(`Invalid token type. Only ${tokenType} allowed for this endpoint`);
        }
        if (decoded.jti &&
            (await this.redis.get(this.redis.revokeTokenKey({
                userId: decoded.sub,
                jti: decoded.jti,
            })))) {
            throw new exception_1.UnauthorizedExeption("Invalid login session");
        }
        const secret = await this.getSignature(parsedTokenType, signatureLevel);
        const verifiedData = jsonwebtoken_1.default.verify(token, secret);
        if (!verifiedData?.sub) {
            throw new exception_1.BadRequestExaption("Invalid token payload");
        }
        const user = await this.userRepository.findOne({
            filter: { _id: verifiedData.sub },
        });
        if (!user) {
            throw new exception_1.NotFoundExeption("User not found");
        }
        if (user.changeCredentialsTime &&
            verifiedData.iat &&
            user.changeCredentialsTime.getTime() >= verifiedData.iat * 1000) {
            throw new exception_1.UnauthorizedExeption("Invalid login session");
        }
        return {
            user: user,
            decode: verifiedData,
        };
    };
    createLoginCredentials = async (user, issuer) => {
        const { accessSignature, refreshSignature } = await this.detectSignatureLevel(user.role);
        const jwtid = (0, crypto_1.randomUUID)();
        const Access_Token = await this.sign({
            payload: { sub: user._id },
            secret: accessSignature,
            options: {
                issuer,
                audience: [
                    enums_1.TokenTypeEnum.ACCESS.toString(),
                    user.role,
                ],
                expiresIn: config_1.ACCESS_EXPIRES_IN,
                jwtid,
            },
        });
        const Refresh_Token = await this.sign({
            payload: { sub: user._id },
            secret: refreshSignature,
            options: {
                issuer,
                audience: [
                    enums_1.TokenTypeEnum.REFRESH.toString(),
                    user.role,
                ],
                expiresIn: config_1.REFRESH_EXPIRES_IN,
                jwtid,
            },
        });
        return { Access_Token, Refresh_Token };
    };
    createRevokeToken = async ({ userId, jti, ttl }) => {
        await this.redis.set({
            key: this.redis.revokeTokenKey({ userId: userId.toString(), jti }),
            value: jti,
            ttl
        });
        return;
    };
}
exports.TokenService = TokenService;
