import { Request } from "express";
import multer, { FileFilterCallback } from "multer";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";

import { StorageApproachEnum } from "../../Enums";
import { BadRequestException } from "../../exceptions";


export const fileValidation = {
  image: ["image/jpeg", "image/png", "image/gif", "image/webp"],
  video: ["video/mp4", "video/quicktime", "video/x-msvideo"],
  document: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
  any: [] as string[], // empty = skip MIME validation
};

export const fileFilter = (validation: string[]) => {
  return (
    req: Request,
    file: Express.Multer.File,
    callback: FileFilterCallback
  ) => {
    if (validation.length && !validation.includes(file.mimetype)) {
      return callback(
        new BadRequestException(
          `Invalid file format. Allowed types: ${validation.join(", ")}`
        )
      );
    }
    return callback(null, true);
  };
};


export const cloudFileUpload = ({
  storageApproach = StorageApproachEnum.MEMORY,
  validation = [],
  maxSize = 2,
}: {
  storageApproach?: StorageApproachEnum;
  validation?: string[];
  maxSize?: number;
}) => {
  const storage =
    storageApproach === StorageApproachEnum.MEMORY
      ? multer.memoryStorage()
      : multer.diskStorage({
          destination: (
            req: Request,
            file: Express.Multer.File,
            callback: (error: Error | null, destination: string) => void
          ) => {
            // tmpdir() is the OS temp folder (/tmp on Linux, %TEMP% on Windows).
            // Files here are cleaned up by the OS automatically.
            callback(null, tmpdir());
          },
          filename: (
            req: Request,
            file: Express.Multer.File,
            callback: (error: Error | null, filename: string) => void
          ) => {
            // Prefix with UUID to avoid collisions when multiple uploads happen
            // at the same time with the same original filename.
            callback(null, `${randomUUID()}__${file.originalname}`);
          },
        });

  return multer({
    fileFilter: fileFilter(validation),
    storage,
    limits: {
      // maxSize is in MB — convert to bytes for multer.
      fileSize: maxSize * 1024 * 1024,
    },
  });
};