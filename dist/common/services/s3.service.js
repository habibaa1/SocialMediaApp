"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.s3Service = exports.S3Service = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const config_1 = require("../../config/config");
const exception_1 = require("../exception");
const crypto_1 = require("crypto");
const enums_1 = require("../enums");
const fs_1 = require("fs");
const lib_storage_1 = require("@aws-sdk/lib-storage");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
class S3Service {
    client;
    constructor() {
        this.client = new client_s3_1.S3Client({
            region: config_1.AWS_REGION,
            credentials: {
                accessKeyId: config_1.AWS_ACCESS_KEY_ID,
                secretAccessKey: config_1.AWS_SECRET_ACCESS_KEY
            }
        });
    }
    async uploadAsset({ storageApproach = enums_1.StorageApproachEnum.MEMORY, Bucket = config_1.AWS_BUCKET_NAME, path = "general", file, ACL = client_s3_1.ObjectCannedACL.private, ContentType }) {
        const command = new client_s3_1.PutObjectCommand({
            Bucket,
            Key: `${config_1.APPLICATION_NAME}/${path}/${(0, crypto_1.randomUUID)()}__${file.originalname}`,
            ACL,
            Body: storageApproach === enums_1.StorageApproachEnum.MEMORY ? file.buffer : (0, fs_1.createReadStream)(file.path),
            ContentType: file.mimetype || ContentType
        });
        if (!command.input?.Key) {
            throw new exception_1.BadRequestExaption("Fail to upload this asset");
        }
        await this.client.send(command);
        return command.input?.Key;
    }
    async uploadLargeAsset({ storageApproach = enums_1.StorageApproachEnum.DISK, Bucket = config_1.AWS_BUCKET_NAME, path = "general", file, ACL = client_s3_1.ObjectCannedACL.private, ContentType, partSize = 5 }) {
        const uploadFile = new lib_storage_1.Upload({
            client: this.client,
            params: {
                Bucket,
                Key: `${config_1.APPLICATION_NAME}/${path}/${(0, crypto_1.randomUUID)()}__${file.originalname}`,
                ACL,
                Body: storageApproach === enums_1.StorageApproachEnum.MEMORY ? file.buffer : (0, fs_1.createReadStream)(file.path),
                ContentType: file.mimetype || ContentType
            },
            partSize: partSize * 1024 * 1024,
        });
        uploadFile.on("httpUploadProgress", (progress) => {
            console.log(progress);
            console.log(`File Upload is ${(progress.loaded / progress.total) * 100} %`);
        });
        return await uploadFile.done();
    }
    async uploadAssets({ storageApproach = enums_1.StorageApproachEnum.MEMORY, uploadApproach = enums_1.UploadApproachEnum.SMALL, Bucket = config_1.AWS_BUCKET_NAME, path = "general", files, ACL = client_s3_1.ObjectCannedACL.private, ContentType }) {
        let urls = [];
        if (uploadApproach === enums_1.UploadApproachEnum.LARGE) {
            const data = await Promise.all(files.map((file) => {
                return this.uploadLargeAsset({
                    storageApproach,
                    file,
                    ACL,
                    Bucket,
                    ContentType,
                    path
                });
            }));
            urls = data.map((ele) => ele.Key);
        }
        else {
            urls = await Promise.all(files.map((file) => {
                return this.uploadAsset({
                    storageApproach,
                    file,
                    ACL,
                    Bucket,
                    ContentType,
                    path
                });
            }));
        }
        return urls;
    }
    async CreatePreSignedUploadLink({ Bucket = config_1.AWS_BUCKET_NAME, path = "general", ContentType, OriginalName, expiresIn = config_1.AWS_EXPIRES_IN }) {
        const command = new client_s3_1.PutObjectCommand({
            Bucket,
            Key: `${config_1.APPLICATION_NAME}/${path}/${(0, crypto_1.randomUUID)()}__${OriginalName}`,
            ContentType
        });
        if (!command.input?.Key) {
            throw new exception_1.BadRequestExaption("Fail to upload this asset");
        }
        const url = await (0, s3_request_presigner_1.getSignedUrl)(this.client, command, { expiresIn });
        return { url, key: command.input.Key };
    }
    async CreatePreSignedFetchLink({ Bucket = config_1.AWS_BUCKET_NAME, Key, expiresIn = config_1.AWS_EXPIRES_IN, fileName, download }) {
        const command = new client_s3_1.GetObjectCommand({
            Bucket,
            Key,
            ResponseContentDisposition: download === "true" ? `attachment; filename="${fileName || Key.split("/").pop()}"` : undefined,
        });
        const url = await (0, s3_request_presigner_1.getSignedUrl)(this.client, command, { expiresIn });
        return url;
    }
    async getAsset({ Bucket = config_1.AWS_BUCKET_NAME, Key }) {
        const command = new client_s3_1.GetObjectCommand({
            Bucket,
            Key
        });
        return await this.client.send(command);
    }
    async deleteAsset({ Bucket = config_1.AWS_BUCKET_NAME, Key }) {
        const command = new client_s3_1.DeleteObjectCommand({
            Bucket,
            Key,
        });
        return await this.client.send(command);
    }
    async deleteAssets({ Bucket = config_1.AWS_BUCKET_NAME, Keys }) {
        const command = new client_s3_1.DeleteObjectsCommand({
            Bucket,
            Delete: {
                Objects: Keys,
                Quiet: false
            }
        });
        return await this.client.send(command);
    }
    async listFolderDir({ Bucket = config_1.AWS_BUCKET_NAME, prefix }) {
        const command = new client_s3_1.ListObjectsV2Command({
            Bucket,
            Prefix: `${config_1.APPLICATION_NAME}/${prefix}`,
        });
        return await this.client.send(command);
    }
    async deleteFolderByPrefix({ Bucket = config_1.AWS_BUCKET_NAME, prefix }) {
        const result = await this.listFolderDir({ Bucket, prefix });
        const Keys = result.Contents?.map(ele => { return { Key: ele.Key }; });
        return await this.deleteAssets({ Bucket, Keys });
    }
}
exports.S3Service = S3Service;
exports.s3Service = new S3Service();
