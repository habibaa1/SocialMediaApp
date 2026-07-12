"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisService = exports.RedisService = void 0;
const redis_1 = require("redis");
const config_1 = require("../../config/config");
const enums_1 = require("../enums");
const exception_1 = require("../exception");
const send_email_1 = require("../utils/email/send.email");
const template_email_1 = require("../utils/email/template.email");
const hash_security_1 = require("../utils/security/hash.security");
const createRandomOtp = () => Math.floor(100000 + Math.random() * 900000);
class RedisService {
    client;
    constructor() {
        this.client = (0, redis_1.createClient)({ url: config_1.REDIS_URI });
        this.handleEvents();
    }
    handleEvents() {
        this.client.on("error", (err) => console.error("Redis not connected ✋", err));
        this.client.on("ready", () => console.log("Redis is connected successfully 👌"));
    }
    async connect() {
        if (!this.client.isOpen)
            await this.client.connect();
    }
    getClient() {
        return this.client;
    }
    async sendEmailOtp({ email, subject, title, }) {
        const blockKey = this.otpBlockKey({ email, type: subject });
        const otpKey = this.otpKey({ email, type: subject });
        const attemptsKey = this.otpMaxRequestKey({ email, type: subject });
        const isBlockedTTL = await this.ttl(blockKey);
        if (isBlockedTTL > 0) {
            throw new exception_1.BadRequestExaption(`Try again after ${isBlockedTTL} seconds`);
        }
        const remainingOtpTTL = await this.ttl(otpKey);
        if (remainingOtpTTL > 0) {
            throw new exception_1.BadRequestExaption(`OTP still active, try again after ${remainingOtpTTL} seconds`);
        }
        const maxTrial = (await this.get(attemptsKey)) || 0;
        if (maxTrial >= 3) {
            await this.set({ key: blockKey, value: 1, ttl: 7 * 60 });
            throw new exception_1.BadRequestExaption("Max OTP attempts reached");
        }
        const code = createRandomOtp();
        const hashedCode = await (0, hash_security_1.generateHash)({ plaintext: `${code}` });
        const exists = await this.exists(attemptsKey);
        await this.set({ key: otpKey, value: hashedCode, ttl: 300 });
        if (!exists) {
            await this.set({ key: attemptsKey, value: 1, ttl: 10 * 60 });
        }
        else {
            await this.increment(attemptsKey);
        }
        await (0, send_email_1.sendEmail)({
            to: email,
            subject,
            html: (0, template_email_1.emailTemplate)({ title, code }),
        });
        console.log(`OTP for ${email}: ${code}`);
    }
    baseRevokeTokenKey(userId) {
        return `RevokeToken::${userId}`;
    }
    revokeTokenKey({ userId, jti } = {}) {
        return `${this.baseRevokeTokenKey(userId)}::${jti}`;
    }
    refreshTokenKey({ userId } = {}) {
        return `RefreshToken::User::${userId}`;
    }
    otpKey(params = {}) {
        const { email, type = enums_1.EmailEnum.CONFIRM_EMAIL } = params;
        if (!email)
            throw new Error("Email is required for OTP key");
        return `OTP::User::${email}::${type}`;
    }
    otpMaxRequestKey(params = {}) {
        return `${this.otpKey(params)}::Request`;
    }
    otpBlockKey(params = {}) {
        return `${this.otpKey(params)}::Block::Request`;
    }
    forgotPasswordLinkKey({ userId } = {}) {
        return `ForgotPasswordLink::User::${userId}`;
    }
    async set({ key, value, ttl } = {}) {
        try {
            if (!key)
                return null;
            const data = typeof value === "string" ? value : JSON.stringify(value);
            if (ttl !== undefined) {
                return await this.client.set(key, data, { EX: ttl });
            }
            return await this.client.set(key, data);
        }
        catch (error) {
            console.log(`Redis set error: ${error}`);
            return null;
        }
    }
    async update({ key, value, ttl } = {}) {
        try {
            if (!key)
                return null;
            const exists = await this.client.exists(key);
            if (!exists)
                return 0;
            return await this.set({
                key,
                value,
                ...(ttl !== undefined ? { ttl } : {}),
            });
        }
        catch (error) {
            console.log(`Redis update error: ${error}`);
            return null;
        }
    }
    async increment(key) {
        try {
            const exists = await this.client.exists(key);
            if (!exists)
                return 0;
            return await this.client.incr(key);
        }
        catch {
            return null;
        }
    }
    async get(key) {
        try {
            const data = await this.client.get(key);
            if (!data)
                return null;
            try {
                return JSON.parse(data);
            }
            catch {
                return data;
            }
        }
        catch {
            return null;
        }
    }
    async ttl(key) {
        try {
            return await this.client.ttl(key);
        }
        catch {
            return -2;
        }
    }
    async exists(key) {
        try {
            return await this.client.exists(key);
        }
        catch {
            return 0;
        }
    }
    async expire({ key, ttl } = {}) {
        try {
            if (!key || ttl === undefined)
                return 0;
            return await this.client.expire(key, ttl);
        }
        catch {
            return 0;
        }
    }
    async mGet(keys = []) {
        try {
            if (!keys.length)
                return [];
            return await this.client.mGet(keys);
        }
        catch {
            return [];
        }
    }
    async keys(prefix) {
        try {
            return await this.client.keys(`${prefix}*`);
        }
        catch {
            return [];
        }
    }
    async deleteKey(key) {
        try {
            if (!key || (Array.isArray(key) && key.length === 0))
                return 0;
            return await this.client.del(key);
        }
        catch {
            return 0;
        }
    }
    FCM_key(userId) {
        return `user:FCM:${userId.toString()}`;
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
    async getAllFCMTokens() {
        const keys = await this.keys("user:FCM:");
        if (!keys.length)
            return [];
        const tokenSet = new Set();
        for (const key of keys) {
            const tokens = await this.client.sMembers(key);
            tokens.forEach((token) => tokenSet.add(token));
        }
        return Array.from(tokenSet);
    }
    async hasFCMs(userId) {
        return await this.client.sCard(this.FCM_key(userId));
    }
    async removeFCMUser(userId) {
        return await this.client.del(this.FCM_key(userId));
    }
    socketKey(userId) {
        return `user:sockets:${userId}`;
    }
    async addSocket(userId, socketId) {
        return await this.client.sAdd(this.socketKey(userId), socketId);
    }
    async removeSocket(userId, socketId) {
        return await this.client.sRem(this.socketKey(userId), socketId);
    }
    async getSockets(userId) {
        return await this.client.sMembers(this.socketKey(userId));
    }
    async hasSockets(userId) {
        return await this.client.sCard(this.socketKey(userId));
    }
    async removeUser(userId) {
        return await this.client.del(this.socketKey(userId));
    }
}
exports.RedisService = RedisService;
exports.redisService = new RedisService();
