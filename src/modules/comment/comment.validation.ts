import { z } from "zod";
import { generalValidationFields } from "../../common/validation";

export const createCommentSchema = {
  body: z.strictObject({
    postId: generalValidationFields.id,
    content: z
      .string()
      .min(1, { message: "Comment content is required" })
      .max(1000),
    attachments: z.array(z.string()).optional(),
  }),
};

export const updateCommentSchema = {
  params: z.strictObject({ id: generalValidationFields.id }),
  body: z
    .strictObject({
      content: z.string().min(1).max(1000).optional(),
      attachments: z.array(z.string()).optional(),
    })
    .refine((value) => Object.keys(value).length > 0, {
      message: "Please provide content or attachments to update",
    }),
};

export const getCommentSchema = {
  params: z.strictObject({ id: generalValidationFields.id }),
};

export const listPostCommentsSchema = {
  params: z.strictObject({ postId: generalValidationFields.id }),
};

export const reactCommentSchema = {
  params: z.strictObject({ id: generalValidationFields.id }),
  body: z.strictObject({
    emoji: z.string().min(1).max(4),
  }),
};

export const deleteCommentSchema = getCommentSchema;

export const replyCommentSchema = {
  params: z.strictObject({ id: generalValidationFields.id }),
  body: z.strictObject({
    content: z
      .string()
      .min(1, { message: "Reply content is required" })
      .max(1000),
    attachments: z.array(z.string()).optional(),
  }),
};
