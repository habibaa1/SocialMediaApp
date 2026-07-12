import { z } from "zod";
import { generalValidationFields } from "../../common/validation";
import { StoryTypeEnum } from "../../common/enums";

export const createStorySchema = {
  body: z.strictObject({
    text: z.string().optional(),
    attachments: z.array(z.string()).optional(),
    type: z.nativeEnum(StoryTypeEnum).optional(),
  }),
};

export const getStorySchema = {
  params: z.strictObject({ id: generalValidationFields.id }),
};

export const deleteStorySchema = getStorySchema;
