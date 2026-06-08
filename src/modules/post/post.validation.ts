import { z } from 'zod';
import { AvailabilityEnum } from '../../common/enums';
import { Types } from 'mongoose';
import { generalValidationFields } from '../../common/validation';
import { fileFieldValidation } from '../../common/utils/multer';

export const createPost = {
    body: z.strictObject({
        content: z.string().optional(),
        files: z.array(generalValidationFields.file(fileFieldValidation.image)).optional(),
        tags: z.array(z.string()).optional(),
        availability: z.coerce.number().default(AvailabilityEnum.PUBLIC)
    }).superRefine((args, ctx) => {
        if (!args.files?.length && !args.content) {
            ctx.addIssue({
                code: "custom",
                path: ['content'],
                message: "Content is required"
            })
        }
        if (args.tags?.length) {

    const uniqueTags = [...new Set(args.tags)]
            if (uniqueTags.length !== args.tags.length) {
                ctx.addIssue({
                    code: "custom",
                    path: ['tags'],
                    message: "Duplicated tag"
                })
            }
                for (const tag of args.tags) {
                    if (!Types.ObjectId.isValid(tag)) {
                        ctx.addIssue({
                            code: "custom",
                            path: ['tags'],
                            message: `Invalid tagged objectId ${tag}`
                        })
                    }
            }
        }
    })
}

export const updatePost = {
        params: z.strictObject({
        postId: generalValidationFields.id
    }),
    body: z.strictObject({
        content: z.string().optional(),
        files: z.array(generalValidationFields.file(fileFieldValidation.image)).optional(),
        removeFiles: z.array(z.string()).optional(),
        removeTags: z.array(z.string()).optional(),

        tags: z.array(generalValidationFields.id).optional(),
        availability: z.coerce.number().optional()
    }).superRefine((args, ctx) => {
        if (!Object.values(args)?.length) {
            ctx.addIssue({
                code: "custom",
                message: "insert data to update the post"
            })
        }
        if (args.tags?.length) {

    const uniqueTags = [...new Set(args.tags)]
            if (uniqueTags.length !== args.tags.length) {
                ctx.addIssue({
                    code: "custom",
                    path: ['tags'],
                    message: "Duplicated tag"
                })
            }
        }
    })
}
export const reactPost = {
    params: z.strictObject({
        postId: generalValidationFields.id
    }),
    query: z.strictObject({
        react: z.coerce.number()
    })
}