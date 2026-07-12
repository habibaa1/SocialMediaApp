    import { resolve } from "path";
    import { config } from "dotenv";

    export const NODE_ENV = (process.env.NODE_ENV || "development") as
    | "development"
    | "production";

    const envPath: Record<typeof NODE_ENV, string> = {
    development: ".env.development",
    production: ".env.production",
    };
    console.log({ env: envPath[NODE_ENV] });

    config({ path: resolve(envPath[NODE_ENV]) });

    export const APPLICATION_NAME = process.env.APPLICATION_NAME;

    export const port = process.env.PORT ?? 7000;

    export const DB_URI = process.env.DB_URI;

    export const ENC_BYTE = process.env.ENC_BYTE;
    export const ENC_IV_LENGTH = parseInt(process.env.ENC_IV_LENGTH ?? "16");

    export const User_TOKEN_SECRET_KEY = process.env.User_TOKEN_SECRET_KEY as string;
    export const System_TOKEN_SECRET_KEY = process.env.System_TOKEN_SECRET_KEY as string;

    export const User_REFRESH_TOKEN_SECRET_KEY =
    process.env.User_REFRESH_TOKEN_SECRET_KEY as string;
    export const System_REFRESH_TOKEN_SECRET_KEY =
    process.env.System_REFRESH_TOKEN_SECRET_KEY as string;

    export const REFRESH_EXPIRES_IN = parseInt(
    process.env.REFRESH_EXPIRES_IN || "31536000",
    );

    export const ACCESS_EXPIRES_IN = parseInt(
    process.env.ACCESS_EXPIRES_IN || "1800",
    );

    export const SALT_ROUND = parseInt(process.env.SALT_ROUND ?? "10");
    export const CLIENT_IDS = process.env.CLIENT_IDS?.split(",") || [];

    export const REDIS_URI = process.env.REDIS_URI  as string;

    export const EMAIL_APP_PASSWORD = process.env.EMAIL_APP_PASSWORD;
    export const EMAIL_APP = process.env.EMAIL_APP;

    export const FACEBOOK_LINK = process.env.FACEBOOK_LINK;
    export const INSTAGRAM_LINK = process.env.INSTAGRAM_LINK;
    export const TWITTER_LINK = process.env.TWITTER_LINK;

    export const ORIGINS = process.env.ORIGINS;

    export const S3_REGION = process.env.S3_REGION as string
    export const S3_EXPIRES_IN = parseInt( process.env.S3_EXPIRES_IN || "120");
    export const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME as string
    export const S3_ACCESS_KEY_ID = process.env.S3_ACCESS_KEY_ID as string
    export const S3_ACCESS_SECRET_KEY = process.env.S3_ACCESS_SECRET_KEY as string