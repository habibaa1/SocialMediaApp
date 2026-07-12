"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.S3_ACCESS_SECRET_KEY = exports.S3_ACCESS_KEY_ID = exports.S3_BUCKET_NAME = exports.S3_EXPIRES_IN = exports.S3_REGION = exports.ORIGINS = exports.TWITTER_LINK = exports.INSTAGRAM_LINK = exports.FACEBOOK_LINK = exports.EMAIL_APP = exports.EMAIL_APP_PASSWORD = exports.REDIS_URI = exports.CLIENT_IDS = exports.SALT_ROUND = exports.ACCESS_EXPIRES_IN = exports.REFRESH_EXPIRES_IN = exports.System_REFRESH_TOKEN_SECRET_KEY = exports.User_REFRESH_TOKEN_SECRET_KEY = exports.System_TOKEN_SECRET_KEY = exports.User_TOKEN_SECRET_KEY = exports.ENC_IV_LENGTH = exports.ENC_BYTE = exports.DB_URI = exports.port = exports.APPLICATION_NAME = exports.NODE_ENV = void 0;
const path_1 = require("path");
const dotenv_1 = require("dotenv");
exports.NODE_ENV = (process.env.NODE_ENV || "development");
const envPath = {
    development: ".env.development",
    production: ".env.production",
};
console.log({ env: envPath[exports.NODE_ENV] });
(0, dotenv_1.config)({ path: (0, path_1.resolve)(envPath[exports.NODE_ENV]) });
exports.APPLICATION_NAME = process.env.APPLICATION_NAME;
exports.port = process.env.PORT ?? 7000;
exports.DB_URI = process.env.DB_URI;
exports.ENC_BYTE = process.env.ENC_BYTE;
exports.ENC_IV_LENGTH = parseInt(process.env.ENC_IV_LENGTH ?? "16");
exports.User_TOKEN_SECRET_KEY = process.env.User_TOKEN_SECRET_KEY;
exports.System_TOKEN_SECRET_KEY = process.env.System_TOKEN_SECRET_KEY;
exports.User_REFRESH_TOKEN_SECRET_KEY = process.env.User_REFRESH_TOKEN_SECRET_KEY;
exports.System_REFRESH_TOKEN_SECRET_KEY = process.env.System_REFRESH_TOKEN_SECRET_KEY;
exports.REFRESH_EXPIRES_IN = parseInt(process.env.REFRESH_EXPIRES_IN || "31536000");
exports.ACCESS_EXPIRES_IN = parseInt(process.env.ACCESS_EXPIRES_IN || "1800");
exports.SALT_ROUND = parseInt(process.env.SALT_ROUND ?? "10");
exports.CLIENT_IDS = process.env.CLIENT_IDS?.split(",") || [];
exports.REDIS_URI = process.env.REDIS_URI;
exports.EMAIL_APP_PASSWORD = process.env.EMAIL_APP_PASSWORD;
exports.EMAIL_APP = process.env.EMAIL_APP;
exports.FACEBOOK_LINK = process.env.FACEBOOK_LINK;
exports.INSTAGRAM_LINK = process.env.INSTAGRAM_LINK;
exports.TWITTER_LINK = process.env.TWITTER_LINK;
exports.ORIGINS = process.env.ORIGINS;
exports.S3_REGION = process.env.S3_REGION;
exports.S3_EXPIRES_IN = parseInt(process.env.S3_EXPIRES_IN || "120");
exports.S3_BUCKET_NAME = process.env.S3_BUCKET_NAME;
exports.S3_ACCESS_KEY_ID = process.env.S3_ACCESS_KEY_ID;
exports.S3_ACCESS_SECRET_KEY = process.env.S3_ACCESS_SECRET_KEY;
