"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteStorySchema = exports.getStorySchema = exports.createStorySchema = void 0;
const zod_1 = require("zod");
const validation_1 = require("../../common/validation");
const enums_1 = require("../../common/enums");
exports.createStorySchema = {
    body: zod_1.z.strictObject({
        text: zod_1.z.string().optional(),
        attachments: zod_1.z.array(zod_1.z.string()).optional(),
        type: zod_1.z.nativeEnum(enums_1.StoryTypeEnum).optional(),
    }),
};
exports.getStorySchema = {
    params: zod_1.z.strictObject({ id: validation_1.generalValidationFields.id }),
};
exports.deleteStorySchema = exports.getStorySchema;
