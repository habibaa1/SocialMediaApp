"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reactOnPostGQL = exports.deletePostSchema = exports.reactPostSchema = exports.likePostSchema = exports.getPostSchema = exports.updatePostSchema = exports.createPostSchema = void 0;
const zod_1 = require("zod");
const validation_1 = require("../../common/validation");
const enums_1 = require("../../common/enums");
const postBaseSchema = zod_1.z.strictObject({
    folderId: zod_1.z.string().min(1, {
        message: "folderId is required",
    }),
    content: zod_1.z.string().optional(),
    attachments: zod_1.z.array(zod_1.z.string()).optional(),
    availability: zod_1.z.nativeEnum(enums_1.AvailabilityEnum).optional(),
});
const postUpdateBodySchema = zod_1.z
    .strictObject({
    folderId: zod_1.z.string().min(1).optional(),
    content: zod_1.z.string().optional(),
    attachments: zod_1.z.array(zod_1.z.string()).optional(),
    availability: zod_1.z.nativeEnum(enums_1.AvailabilityEnum).optional(),
})
    .refine((value) => Boolean(value.folderId) ||
    Boolean(value.content?.trim()) ||
    (value.attachments?.length ?? 0) > 0 ||
    value.availability !== undefined, {
    message: "At least one field must be provided to update",
});
exports.createPostSchema = {
    body: postBaseSchema.refine((value) => Boolean(value.content?.trim()) || (value.attachments?.length ?? 0) > 0, {
        message: "content or attachments are required",
    }),
};
exports.updatePostSchema = {
    params: zod_1.z.strictObject({
        id: validation_1.generalValidationFields.id,
    }),
    body: postUpdateBodySchema,
};
exports.getPostSchema = {
    params: zod_1.z.strictObject({
        id: validation_1.generalValidationFields.id,
    }),
};
exports.likePostSchema = exports.getPostSchema;
exports.reactPostSchema = {
    params: zod_1.z.strictObject({
        id: validation_1.generalValidationFields.id,
    }),
    body: zod_1.z.strictObject({
        emoji: zod_1.z.string().min(1).max(4),
    }),
};
exports.deletePostSchema = exports.getPostSchema;
exports.reactOnPostGQL = zod_1.z.strictObject({
    postID: validation_1.generalValidationFields.id,
    react: zod_1.z.coerce.number(),
});
