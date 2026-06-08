"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisService = exports.RedisService = void 0;
const redis_1 = require("redis");
const config_1 = require("../../config/config");
const enums_1 = require("../enums");
class RedisService {
    client;
    constructor() {
        this.client = (0, redis_1.createClient)({
            url: config_1.REDIS_URI
        });
        this.handleEvents();
    }
    handleEvents() {
        this.client.on("error", (err) => console.error("Redis Client Error", err));
        this.client.on("ready", () => console.log("Redis Client is ready"));
    }
    async connect() {
        await this.client.connect();
        console.log("Connected to Redis😘");
    }
    otpKey = ({ email, subject = enums_1.EmailEnum.Confirm_Email }) => {
        return `OTP::User::${email}::${subject}`;
    };
    maxAttemptOtpKey = ({ email, subject = enums_1.EmailEnum.Confirm_Email }) => {
        return `${this.otpKey({ email, subject })}::MaxTrial`;
    };
    blockOtpKey = ({ email, subject = enums_1.EmailEnum.Confirm_Email }) => {
        return `${this.otpKey({ email, subject })}::block`;
    };
    baseRevokeTokenKey = (userId) => {
        return `RevokeToken::${userId.toString()}`;
    };
    revokeTokenKey = ({ userId, jti }) => {
        return `${this.baseRevokeTokenKey(userId)}::${jti}`;
    };
    set = async ({ key, value, ttl, }) => {
        try {
            let data = typeof value === "string" ? value : JSON.stringify(value);
            return ttl ? await this.client.set(key, data, { EX: ttl }) : await this.client.set(key, data);
        }
        catch (error) {
            console.log(`fail in redis set operation ${error}`);
            return null;
        }
    };
    update = async ({ key, value, ttl, }) => {
        try {
            if (!await this.client.exists(key))
                return 0;
            return await this.set({ key, value, ttl });
        }
        catch (error) {
            console.log(`fail in redis update operation ${error}`);
            return 0;
        }
    };
    get = async (key) => {
        try {
            try {
                return JSON.parse(await this.client.get(key));
            }
            catch (error) {
                return await this.client.get(key);
            }
        }
        catch (error) {
            console.log(`fail in redis get operation ${error}`);
            return;
        }
    };
    ttl = async (key) => {
        try {
            return await this.client.ttl(key);
        }
        catch (error) {
            console.log(`fail in redis ttl operation ${error}`);
            return -2;
        }
    };
    exist = async (key) => {
        try {
            return await this.client.exists(key);
        }
        catch (error) {
            console.log(`fail in redis exist operation ${error}`);
            return -2;
        }
    };
    incr = async (key) => {
        try {
            return await this.client.exists(key);
        }
        catch (error) {
            console.log(`fail in redis incr operation ${error}`);
            return -2;
        }
    };
    expire = async ({ key, ttl, }) => {
        try {
            return await this.client.expire(key, ttl);
            ;
        }
        catch (error) {
            console.log(`fail in redis add-expire operation ${error}`);
            return 0;
        }
    };
    mGet = async (keys) => {
        try {
            if (keys.length)
                return 0;
            return await this.client.mGet(keys);
        }
        catch (error) {
            console.error("Redis MGET error:", error);
            return [];
        }
    };
    Keys = async (prefix) => {
        try {
            return await this.client.keys(`${prefix}`);
        }
        catch (error) {
            console.log(`fail in redis keys operation ${error}`);
            return [];
        }
    };
    deleteKey = async (key) => {
        try {
            if (!key.length)
                return 0;
            return await this.client.del(key);
        }
        catch (error) {
            console.log(`fail in redis keys operation ${error}`);
            return 0;
        }
    };
    FCM_key(userId) {
        return `user:FCM:${userId}`;
    }
    async addFCM(userId, FCMToken) {
        return await this.client.sAdd(this.FCM_key(userId), FCMToken);
    }
    async removeFCM(userId, FCMToken) {
        return await this.client.sRem(this.FCM_key(userId), FCMToken);
    }
    async getFCMs(userId) {
        return await this.client.sMembers(this.FCM_key(userId));
    }
    async hasFCMs(userId) {
        return await this.client.sCard(this.FCM_key(userId));
    }
    async removeFCMUser(userId) {
        return await this.client.del(this.FCM_key(userId));
    }
}
exports.RedisService = RedisService;
exports.redisService = new RedisService();
