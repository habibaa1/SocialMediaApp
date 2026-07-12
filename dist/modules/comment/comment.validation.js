"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.replyCommentSchema = exports.deleteCommentSchema = exports.reactCommentSchema = exports.listPostCommentsSchema = exports.getCommentSchema = exports.updateCommentSchema = exports.createCommentSchema = void 0;
const zod_1 = require("zod");
const validation_1 = require("../../common/validation");
exports.createCommentSchema = {
    body: zod_1.z.strictObject({
        postId: validation_1.generalValidationFields.id,
        content: zod_1.z
            .string()
            .min(1, { message: "Comment content is required" })
            .max(1000),
        attachments: zod_1.z.array(zod_1.z.string()).optional(),
    }),
};
exports.updateCommentSchema = {
    params: zod_1.z.strictObject({ id: validation_1.generalValidationFields.id }),
    body: zod_1.z
        .strictObject({
        content: zod_1.z.string().min(1).max(1000).optional(),
        attachments: zod_1.z.array(zod_1.z.string()).optional(),
    })
        .refine((value) => Object.keys(value).length > 0, {
        message: "Please provide content or attachments to update",
    }),
};
exports.getCommentSchema = {
    params: zod_1.z.strictObject({ id: validation_1.generalValidationFields.id }),
};
exports.listPostCommentsSchema = {
    params: zod_1.z.strictObject({ postId: validation_1.generalValidationFields.id }),
};
exports.reactCommentSchema = {
    params: zod_1.z.strictObject({ id: validation_1.generalValidationFields.id }),
    body: zod_1.z.strictObject({
        emoji: zod_1.z.string().min(1).max(4),
    }),
};
exports.deleteCommentSchema = exports.getCommentSchema;
exports.replyCommentSchema = {
    params: zod_1.z.strictObject({ id: validation_1.generalValidationFields.id }),
    body: zod_1.z.strictObject({
        content: zod_1.z
            .string()
            .min(1, { message: "Reply content is required" })
            .max(1000),
        attachments: zod_1.z.array(zod_1.z.string()).optional(),
    }),
};
