import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
  ObjectCannedACL,
  GetObjectCommandOutput,
  DeleteObjectCommandOutput,
  DeleteObjectsCommandOutput,
} from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";
import { createReadStream } from "fs";
import { promisify } from "node:util";
import { pipeline } from "node:stream";
import {
  APPLICATION_NAME,
  S3_ACCESS_KEY_ID,
  S3_ACCESS_SECRET_KEY,
  S3_BUCKET_NAME,
  S3_EXPIRES_IN,
  S3_REGION,
} from "../../config/config";
import { StorageApproachEnum, UploadApproachEnum } from "../Enums";
import { BadRequestException } from "../exceptions";

export const writePipeLine = promisify(pipeline);

export class S3Service {
  private client: S3Client;

  constructor() {
    this.client = new S3Client({
      region: S3_REGION,
      credentials: {
        accessKeyId: S3_ACCESS_KEY_ID,
        secretAccessKey: S3_ACCESS_SECRET_KEY,
      },
    });
  }

  async uploadFile(
    file: Express.Multer.File,
    path: string,
    ContentType?: string,
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: `${APPLICATION_NAME}/${path}/${randomUUID()}__${file.originalname}`,
      ACL: ObjectCannedACL.private,
      Body: file.buffer,
      ContentType: file.mimetype || ContentType,
    });

    await this.client.send(command);

    if (!command.input.Key) {
      throw new BadRequestException("Fail to upload this file");
    }

    return command.input.Key as string;
  }

  async uploadLargeFile({
    storageApproach = StorageApproachEnum.DISK,
    Bucket = S3_BUCKET_NAME,
    path = "general",
    ACL = ObjectCannedACL.private,
    file,
    ContentType,
  }: {
    storageApproach?: StorageApproachEnum;
    Bucket?: string;
    path?: string;
    file: Express.Multer.File;
    ACL?: ObjectCannedACL;
    ContentType?: string;
  }): Promise<string> {
    const upload = new Upload({
      client: this.client,
      params: {
        Bucket,
        Key: `${APPLICATION_NAME}/${path}/${randomUUID()}_${file.originalname}`,
        ACL,
        Body:
          storageApproach === StorageApproachEnum.MEMORY
            ? file.buffer
            : createReadStream(file.path),
        ContentType: file.mimetype || ContentType,
      },
    });

    upload.on("httpUploadProgress", (progress) => {
      console.log(
        `Uploaded file progress: ${progress.loaded}/${progress.total} bytes`,
      );
    });

    const result = await upload.done();

    if (!result.Key) {
      throw new BadRequestException("Fail to upload large file");
    }

    return result.Key;
  }

  async uploadFiles({
    storageApproach = StorageApproachEnum.MEMORY,
    uploadApproach = UploadApproachEnum.LARGE,
    Bucket = S3_BUCKET_NAME,
    path = "general",
    ACL = ObjectCannedACL.private,
    files,
  }: {
    storageApproach?: StorageApproachEnum;
    uploadApproach?: UploadApproachEnum;
    Bucket?: string;
    path?: string;
    files: Express.Multer.File[];
    ACL?: ObjectCannedACL;
  }): Promise<string[]> {
    const uploadFn =
      uploadApproach === UploadApproachEnum.LARGE
        ? (f: Express.Multer.File) =>
            this.uploadLargeFile({
              storageApproach,
              Bucket,
              path,
              ACL,
              file: f,
            })
        : (f: Express.Multer.File) => this.uploadFile(f, path);

    return Promise.all(files.map(uploadFn));
  }

  async getFile({
    Bucket = S3_BUCKET_NAME,
    Key,
  }: {
    Bucket?: string;
    Key: string;
  }): Promise<GetObjectCommandOutput> {
    const command = new GetObjectCommand({ Bucket, Key });
    return this.client.send(command);
  }

  async listFiles({
    Bucket = S3_BUCKET_NAME,
    folderKey,
  }: {
    Bucket?: string;
    folderKey: string;
  }) {
    const command = new ListObjectsV2Command({
      Bucket,
      Prefix: `${APPLICATION_NAME}/${folderKey}`,
    });

    const objectList = await this.client.send(command);
    return objectList;
  }

  async deleteFile({
    Bucket = S3_BUCKET_NAME,
    Key,
  }: {
    Bucket?: string;
    Key: string;
  }): Promise<DeleteObjectCommandOutput> {
    const command = new DeleteObjectCommand({ Bucket, Key });
    return this.client.send(command);
  }

  async deleteFiles({
    Bucket = S3_BUCKET_NAME,
    keysToDelete,
    Quiet = false,
  }: {
    Bucket?: string;
    keysToDelete: string[];
    Quiet?: boolean;
  }): Promise<DeleteObjectsCommandOutput> {
    const command = new DeleteObjectsCommand({
      Bucket,
      Delete: {
        Objects: keysToDelete.map((Key) => ({ Key })),
        Quiet,
      },
    });

    return this.client.send(command);
  }

  async deleteFolderContent({
    Bucket = S3_BUCKET_NAME,
    Quiet = false,
    folderKey,
  }: {
    Bucket?: string;
    Quiet?: boolean;
    folderKey: string;
  }): Promise<DeleteObjectsCommandOutput> {
    const objects = await this.listFiles({ Bucket, folderKey });

    if (!objects.Contents?.length) {
      throw new BadRequestException(
        `No objects found under folder: ${folderKey}`,
      );
    }

    const keysToDelete = objects.Contents.map((obj) => obj.Key as string);

    return this.deleteFiles({ Bucket, keysToDelete, Quiet });
  }

  async createPreSignedUploadLink({
    expiresIn = S3_EXPIRES_IN,
    Bucket = S3_BUCKET_NAME,
    path = "general",
    ContentType,
    originalname,
  }: {
    expiresIn?: number;
    Bucket?: string;
    path?: string;
    ContentType: string;
    originalname: string;
  }): Promise<{ url: string; Key: string }> {
    const Key = `${APPLICATION_NAME}/${path}/${randomUUID()}_${originalname}`;

    const command = new PutObjectCommand({ Bucket, Key, ContentType });
    const url = await getSignedUrl(this.client, command, { expiresIn });

    return { url, Key };
  }

  async createPreSignedDownloadLink({
    Bucket = S3_BUCKET_NAME,
    Key,
    expiresIn = 60,
    downloadName,
  }: {
    Bucket?: string;
    Key: string;
    expiresIn?: number;
    downloadName?: string;
  }): Promise<string> {
    const command = new GetObjectCommand({
      Bucket,
      Key,
      ResponseContentDisposition: `attachment; filename="${
        downloadName || Key.split("/").pop()
      }"`,
    });

    return getSignedUrl(this.client, command, { expiresIn });
  }
}

export const s3Service = new S3Service();
