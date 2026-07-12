    import { HydratedDocument } from "mongoose";
    import { Readable } from "node:stream";
    import { promisify } from "node:util";
    import { pipeline } from "node:stream";
    import { IUser } from "../../common/interfaces";
    import {
    LogOutEnum,
    StorageApproachEnum,
    UploadApproachEnum,
    } from "../../common/enums";
    import {
    redisService,
    RedisService,
    s3Service,
    S3Service,
    TokenService,
    } from "../../common/services";
    import {
    BadRequestExaption,
    ConflictExeption,
    } from "../../common/exception";
    import {
    ACCESS_TOKEN_EXPIRES_IN,
    REFRESH_TOKEN_EXPIRES_IN,
    } from "../../config/config";
    import { UserRepository } from "../../DB/repository";

    const writePipeLine = promisify(pipeline);

    export class UserService {
    private readonly redis: RedisService;
    private readonly tokens: TokenService;
    private readonly s3: S3Service;
    private userRepository: UserRepository;
    constructor() {
        this.redis = redisService;
        this.tokens = new TokenService();
        this.s3 = s3Service;
        this.userRepository = new UserRepository();
    }

    // ─── //PROFILE ───────────────────────────────────────────────────────────────
    async profile(userId: string): Promise<IUser> {
        const data = (await this.userRepository.findOne({
        filter: {
            _id: userId,
        },

        options: {
            populate: [{ path: "friends" }],
        },
        })) as HydratedDocument<IUser>;
        if (!data) {
        throw new BadRequestExaption("User not found");
        }
        return data.toJSON();
    }

    // ─── PROFILE IMAGE (pre-signed upload) ────────────────────────────────────

    async profileImage(
        {
        ContentType,
        originalname,
        }: { ContentType: string; originalname: string },
        user: HydratedDocument<IUser>,
    ): Promise<{ user: IUser; url: string }> {
        const { Key, url } = await this.s3.createPreSignedUploadLink({
        path: `users/${user._id.toString()}/profile`,
        ContentType,
        originalname,
        });

        user.profileImage = Key;
        await user.save();

        return { user: user.toJSON(), url };
    }

    // ─── PROFILE COVER IMAGES (direct multipart upload) ───────────────────────

    async profileCoverImages(
        files: Express.Multer.File[],
        user: HydratedDocument<IUser>,
    ): Promise<IUser> {
        if (!files || files.length === 0) {
        throw new BadRequestExaption("No files provided");
        }

        const keys = await this.s3.uploadFiles({
        files,
        path: `users/${user._id.toString()}/cover`,
        storageApproach: StorageApproachEnum.DISK,
        uploadApproach: UploadApproachEnum.LARGE,
        });

        user.coverImages = keys;
        await user.save();

        return user.toJSON();
    }

    // ─── GENERIC PRE-SIGNED UPLOAD LINK ───────────────────────────────────────

    async createPresignedUploadLink(
        {
        ContentType,
        originalname,
        path,
        }: { ContentType: string; originalname: string; path?: string },
        user: HydratedDocument<IUser>,
    ): Promise<{ uploadUrl: string; fileKey: string }> {
        if (!ContentType || !originalname) {
        throw new BadRequestExaption(
            "ContentType and originalname are required",
        );
        }

        const { url, Key } = await this.s3.createPreSignedUploadLink({
        ContentType,
        originalname,
        path: path || `users/${user._id.toString()}/uploads`,
        expiresIn: 3600, // 1 hour
        });

        return { uploadUrl: url, fileKey: Key };
    }

    // ─── STREAM FILE (proxy through server) ───────────────────────────────────
    // For ACL=private files — the client has no direct S3 access.

    async streamFile(
        key: string,
    ): Promise<{ stream: Readable; ContentType: string | undefined }> {
        if (!key) {
        throw new BadRequestExaption("Missing file key");
        }

        const s3Response = await this.s3.getFile({ Key: key });

        if (!s3Response?.Body) {
        throw new BadRequestExaption("File not found or could not be fetched");
        }

        return {
        stream: s3Response.Body as Readable,
        ContentType: s3Response.ContentType,
        };
    }

    // Pipe the S3 readable stream directly into an Express response (no buffering).
    async pipeFileTo(
        stream: Readable,
        destination: NodeJS.WritableStream,
    ): Promise<void> {
        await writePipeLine(stream, destination);
    }

    // ─── PRE-SIGNED DOWNLOAD URL ───────────────────────────────────────────────

    async getDownloadUrl(key: string, downloadName?: string): Promise<string> {
        if (!key) {
        throw new BadRequestExaption("Missing file key");
        }

        return this.s3.createPreSignedDownloadLink({
        Key: key,
        expiresIn: 60,
        ...(downloadName && { downloadName }),
        });
    }

    // ─── SOFT DELETE ───────────────────────────────────────────────────────────

    async softDelete(
        user: HydratedDocument<IUser>,
        { sub }: { sub: string },
    ): Promise<void> {
        if (user.$isDeleted()) {
        throw new ConflictExeption("Account is already deleted");
        }

        user.$isDeleted(true);
        user.deletedAt = new Date();

        user.changeCredentialsTime = new Date();
        await user.save();

        await this.redis.deleteKey(
        await this.redis.keys(this.redis.baseRevokeTokenKey(sub)),
        );
    }

    async logout(
        { flag }: { flag: LogOutEnum },
        user: HydratedDocument<IUser>,
        { jti, iat, sub }: { jti: string; iat: number; sub: string },
    ): Promise<number> {
        let status = 200;

        switch (flag) {
        case LogOutEnum.ALL:
            user.changeCredentialsTime = new Date();
            await user.save();
            await this.redis.deleteKey(
            await this.redis.keys(this.redis.baseRevokeTokenKey(sub)),
            );
            break;

        default:
            await this.tokens.createRevokeToken({
            userId: sub,
            jti,
            ttl: Math.max(
                1,
                iat + REFRESH_TOKEN_EXPIRES_IN - Math.floor(Date.now() / 1000),
            ),
            });
            status = 201;
            break;
        }

        return status;
    }

    async rotateToken(
        user: HydratedDocument<IUser>,
        { jti, iat, sub }: { jti: string; iat: number; sub: string },
        issuer: string,
    ) {
        if ((iat + ACCESS_TOKEN_EXPIRES_IN) * 1000 >= Date.now() + 30000) {
        throw new ConflictExeption("Current access token still valid");
        }

        await this.tokens.createRevokeToken({
        userId: sub,
        jti,
        ttl: Math.max(
            1,
            iat + REFRESH_TOKEN_EXPIRES_IN - Math.floor(Date.now() / 1000),
        ),
        });

        return this.tokens.createLoginCredentials(user, issuer);
    }
    }

    export default new UserService();
