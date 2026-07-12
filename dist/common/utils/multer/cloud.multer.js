"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cloudFileUpload = exports.fileFilter = exports.fileValidation = void 0;
const multer_1 = __importDefault(require("multer"));
const node_os_1 = require("node:os");
const node_crypto_1 = require("node:crypto");
const enums_1 = require("../../enums");
const exception_1 = require("../../exception");
exports.fileValidation = {
    image: ["image/jpeg", "image/png", "image/gif", "image/webp"],
    video: ["video/mp4", "video/quicktime", "video/x-msvideo"],
    document: [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
    any: [],
};
const fileFilter = (validation) => {
    return (req, file, callback) => {
        if (validation.length && !validation.includes(file.mimetype)) {
            return callback(new exception_1.BadRequestExaption(`Invalid file format. Allowed types: ${validation.join(", ")}`));
        }
        return callback(null, true);
    };
};
exports.fileFilter = fileFilter;
const cloudFileUpload = ({ storageApproach = enums_1.StorageApproachEnum.MEMORY, validation = [], maxSize = 2, }) => {
    const storage = storageApproach === enums_1.StorageApproachEnum.MEMORY
        ? multer_1.default.memoryStorage()
        : multer_1.default.diskStorage({
            destination: (req, file, callback) => {
                callback(null, (0, node_os_1.tmpdir)());
            },
            filename: (req, file, callback) => {
                callback(null, `${(0, node_crypto_1.randomUUID)()}__${file.originalname}`);
            },
        });
    return (0, multer_1.default)({
        fileFilter: (0, exports.fileFilter)(validation),
        storage,
        limits: {
            fileSize: maxSize * 1024 * 1024,
        },
    });
};
exports.cloudFileUpload = cloudFileUpload;
