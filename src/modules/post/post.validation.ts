import { z } from "zod";

import { generalValidation } from "../../common/validation";

import { AvailabilityEnum } from "../../common/Enums";

const postBaseSchema = z.strictObject({
  folderId: z.string().min(1, {
    message: "folderId is required",
  }),

  content: z.string().optional(),

  attachments: z.array(z.string()).optional(),

  availability: z.nativeEnum(AvailabilityEnum).optional(),
});

const postUpdateBodySchema = z
  .strictObject({
    folderId: z.string().min(1).optional(),

    content: z.string().optional(),

    attachments: z.array(z.string()).optional(),

    availability: z.nativeEnum(AvailabilityEnum).optional(),
  })

  .refine(
    (value) =>
      Boolean(value.folderId) ||
      Boolean(value.content?.trim()) ||
      (value.attachments?.length ?? 0) > 0 ||
      value.availability !== undefined,

    {
      message: "At least one field must be provided to update",
    },
  );

export const createPostSchema = {
  body: postBaseSchema.refine(
    (value) =>
      Boolean(value.content?.trim()) || (value.attachments?.length ?? 0) > 0,

    {
      message: "content or attachments are required",
    },
  ),
};

export const updatePostSchema = {
  params: z.strictObject({
    id: generalValidation.id,
  }),

  body: postUpdateBodySchema,
};

export const getPostSchema = {
  params: z.strictObject({
    id: generalValidation.id,
  }),
};

export const likePostSchema = getPostSchema;

export const reactPostSchema = {
  params: z.strictObject({
    id: generalValidation.id,
  }),

  body: z.strictObject({
    emoji: z.string().min(1).max(4),
  }),
};

export const deletePostSchema = getPostSchema;

export const reactOnPostGQL = z.strictObject({
  postID: generalValidation.id,
  react: z.coerce.number(),
});
