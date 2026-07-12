import { RedisClientType, createClient } from "redis";
import { Types } from "mongoose";
import { REDIS_URI } from "../../config/config";
import { EmailEnum } from "../Enums";
import { BadRequestException } from "../exceptions";
import { sendEmail } from "../utils/email/send.email";
import { emailTemplate } from "../utils/email/template.email";
import { generateHash } from "../utils/security/hash.security";


const createRandomOtp = (): number =>
  Math.floor(100000 + Math.random() * 900000);

// type for key generators
type KeyType = {
  userId?: string;
  jti?: string;
  email?: string;
  type?: EmailEnum;
};

type SetType = {
  key?: string;
  value?: unknown;
  ttl?: number;
};

export class RedisService {
  private readonly client: RedisClientType;

  constructor() {
    this.client = createClient({ url: REDIS_URI });
    this.handleEvents();
  }

  private handleEvents(): void {
    this.client.on("error", (err: Error) =>
      console.error("Redis not connected ✋", err),
    );
    this.client.on("ready", () =>
      console.log("Redis is connected successfully 👌"),
    );
  }

  async connect(): Promise<void> {
    if (!this.client.isOpen) await this.client.connect();
  }
  
  getClient(): RedisClientType {
    return this.client;
  }

  //         OTP operation
  async sendEmailOtp({
    email,
    subject,
    title,
  }: {
    email: string;
    subject: EmailEnum;
    title: string;
  }) {
    const blockKey = this.otpBlockKey({ email, type: subject });
    const otpKey = this.otpKey({ email, type: subject });
    const attemptsKey = this.otpMaxRequestKey({ email, type: subject });

    // check block
    const isBlockedTTL = await this.ttl(blockKey);
    if (isBlockedTTL > 0) {
      throw new BadRequestException(`Try again after ${isBlockedTTL} seconds`);
    }

    // check existing otp
    const remainingOtpTTL = await this.ttl(otpKey);
    if (remainingOtpTTL > 0) {
      throw new BadRequestException(
        `OTP still active, try again after ${remainingOtpTTL} seconds`,
      );
    }

    // max trials
    const maxTrial = (await this.get<number>(attemptsKey)) || 0;
    if (maxTrial >= 3) {
      await this.set({ key: blockKey, value: 1, ttl: 7 * 60 });
      throw new BadRequestException("Max OTP attempts reached");
    }

    const code = createRandomOtp();
    const hashedCode = await generateHash({ plaintext: `${code}` });
    const exists = await this.exists(attemptsKey);
    await this.set({ key: otpKey, value: hashedCode, ttl: 300 });

    if (!exists) {
      await this.set({ key: attemptsKey, value: 1, ttl: 10 * 60 });
    } else {
      await this.increment(attemptsKey);
    }

    await sendEmail({
      to: email,
      subject,
      html: emailTemplate({ title, code }),
    });

    console.log(`OTP for ${email}: ${code}`);
  }

  //         key generators

  baseRevokeTokenKey(userId?: string): string {
    return `RevokeToken::${userId}`;
  }

  revokeTokenKey({ userId, jti }: KeyType = {}): string {
    return `${this.baseRevokeTokenKey(userId)}::${jti}`;
  }

  refreshTokenKey({ userId }: KeyType = {}): string {
    return `RefreshToken::User::${userId}`;
  }

  otpKey(params: KeyType = {}): string {
    const { email, type = EmailEnum.CONFIRM_EMAIL } = params;
    if (!email) throw new Error("Email is required for OTP key");
    return `OTP::User::${email}::${type}`;
  }

  otpMaxRequestKey(params: KeyType = {}): string {
    return `${this.otpKey(params)}::Request`;
  }

  otpBlockKey(params: KeyType = {}): string {
    return `${this.otpKey(params)}::Block::Request`;
  }

  forgotPasswordLinkKey({ userId }: KeyType = {}): string {
    return `ForgotPasswordLink::User::${userId}`;
  }

  //         operations

  async set({ key, value, ttl }: SetType = {}): Promise<string | null> {
    try {
      if (!key) return null;
      const data = typeof value === "string" ? value : JSON.stringify(value);
      if (ttl !== undefined) {
        return await this.client.set(key, data, { EX: ttl });
      }
      return await this.client.set(key, data);
    } catch (error) {
      console.log(`Redis set error: ${error}`);
      return null;
    }
  }

  async update({ key, value, ttl }: SetType = {}): Promise<
    string | number | null
  > {
    try {
      if (!key) return null;
      const exists = await this.client.exists(key);
      if (!exists) return 0;
      return await this.set({
        key,
        value,
        ...(ttl !== undefined ? { ttl } : {}),
      });
    } catch (error) {
      console.log(`Redis update error: ${error}`);
      return null;
    }
  }

  async increment(key: string): Promise<number | null> {
    try {
      const exists = await this.client.exists(key);
      if (!exists) return 0;
      return await this.client.incr(key);
    } catch {
      return null;
    }
  }

  async get<T = any>(key: string): Promise<T | null> {
    try {
      const data = await this.client.get(key);
      if (!data) return null;
      try {
        return JSON.parse(data) as T;
      } catch {
        return data as unknown as T;
      }
    } catch {
      return null;
    }
  }

  async ttl(key: string): Promise<number> {
    try {
      return await this.client.ttl(key);
    } catch {
      return -2;
    }
  }

  async exists(key: string): Promise<number> {
    try {
      return await this.client.exists(key);
    } catch {
      return 0;
    }
  }

  async expire({ key, ttl }: SetType = {}): Promise<number> {
    try {
      if (!key || ttl === undefined) return 0;
      return await this.client.expire(key, ttl);
    } catch {
      return 0;
    }
  }

  async mGet(keys: string[] = []): Promise<(string | null)[]> {
    try {
      if (!keys.length) return [];
      return await this.client.mGet(keys);
    } catch {
      return [];
    }
  }

  async keys(prefix: string): Promise<string[]> {
    try {
      return await this.client.keys(`${prefix}*`);
    } catch {
      return [];
    }
  }

  async deleteKey(key: string | string[]): Promise<number> {
    try {
      if (!key || (Array.isArray(key) && key.length === 0)) return 0;

      return await this.client.del(key);
    } catch {
      return 0;
    }
  }

  FCM_key(userId: Types.ObjectId | string) {
    return `user:FCM:${userId.toString()}`;
  }

  async addFCM(userId: Types.ObjectId | string, FCMToken: string) {
    return await this.client.sAdd(this.FCM_key(userId), FCMToken);
  }

  async removeFCM(userId: Types.ObjectId | string, FCMToken: string) {
    return await this.client.sRem(this.FCM_key(userId), FCMToken);
  }

  async getFCMs(userId: Types.ObjectId | string) {
    return await this.client.sMembers(this.FCM_key(userId));
  }

  async getAllFCMTokens(): Promise<string[]> {
    const keys = await this.keys("user:FCM:");
    if (!keys.length) return [];
    const tokenSet = new Set<string>();
    for (const key of keys) {
      const tokens = await this.client.sMembers(key);
      tokens.forEach((token) => tokenSet.add(token));
    }
    return Array.from(tokenSet);
  }

  async hasFCMs(userId: Types.ObjectId | string) {
    return await this.client.sCard(this.FCM_key(userId));
  }

  async removeFCMUser(userId: Types.ObjectId | string) {
    return await this.client.del(this.FCM_key(userId));
  }


  socketKey(userId: Types.ObjectId | string) {
    return `user:sockets:${userId}`;
  }
  async addSocket(userId: Types.ObjectId | string, socketId: string) {
    return await this.client.sAdd(this.socketKey(userId), socketId);
  }

  async removeSocket(userId: Types.ObjectId | string, socketId: string) {
    return await this.client.sRem(this.socketKey(userId), socketId);
  }

  async getSockets(userId: Types.ObjectId | string) {
    return await this.client.sMembers(this.socketKey(userId));
  }

  async hasSockets(userId: Types.ObjectId | string) {
    return await this.client.sCard(this.socketKey(userId));
  }

  async removeUser(userId: Types.ObjectId | string) {
    return await this.client.del(this.socketKey(userId));
  }
}

export const redisService = new RedisService();
