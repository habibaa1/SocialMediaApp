import { resolve } from 'node:path';
import { config } from 'dotenv';


config({ path: resolve(`./.env.${process.env.NODE_ENV || "development"}`) });

export const PORT = process.env.PORT;
export const DB_URI = process.env.DB_URI;

export const SALT_ROUND = Number(process.env.SALT_ROUNDS) || 10;

export const ENC_KEY = process.env.ENC_KEY || "my_secret_key_12345678901234567"; 

export const ENC_IV_LENGTH = Number(process.env.ENC_IV_LENGTH) || 16;

export const USER_ACCESS_TOKEN_SIGNATURE = process.env.USER_ACCESS_TOKEN_SIGNATURE as string;
export const USER_REFRESH_TOKEN_SIGNATURE = process.env.USER_REFRESH_TOKEN_SIGNATURE as string;

export const SYSTEM_ACCESS_TOKEN_SIGNATURE = process.env.SYSTEM_ACCESS_TOKEN_SIGNATURE as string;
export const SYSTEM_REFRESH_TOKEN_SIGNATURE = process.env.SYSTEM_REFRESH_TOKEN_SIGNATURE as string;
export const ACCESS_TOKEN_EXPIRES_IN = parseInt(process.env.ACCESS_TOKEN_EXPIRES_IN ?? "1800");
export const REFRESH_TOKEN_EXPIRES_IN = parseInt(process.env.REFRESH_TOKEN_EXPIRES_IN ?? "1800");
export const FACEBOOK = process.env.FACEBOOK || "https://www.facebook.com";
export const INSTAGRAM = process.env.INSTAGRAM || "https://www.instagram.com";
export const TWITTER = process.env.TWITTER || "https://www.twitter.com";

export const APP_EMAIL = process.env.APP_EMAIL;
export const APP_EMAIL_PASSWORD = process.env.APP_EMAIL_PASSWORD;
export const APPLICATION_NAME = process.env.APPLICATION_NAME || "My Application";
export const REDIS_URI = process.env.REDIS_URI as string;
export const ORIGINS = (process.env.ORIGINS?.split(",") || []) as string[];
export const CLIENT_IDS = (process.env.CLIENT_IDS?.split(",") || []) as string[];

export const AWS_REGION = process.env.AWS_REGION as string;
export const AWS_BUCKET_NAME = process.env.AWS_BUCKET_NAME as string;
export const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID as string;
export const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY as string;
export const AWS_EXPIRES_IN = parseInt(process.env.AWS_EXPIRES_IN as string) || 120;