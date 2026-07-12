import { z } from "zod";
import { generalValidation } from "../../common/validation";
import { StoryTypeEnum } from "../../common/Enums";

export const createStorySchema = {
  body: z.strictObject({
    text: z.string().optional(),
    attachments: z.array(z.string()).optional(),
    type: z.nativeEnum(StoryTypeEnum).optional(),
  }),
};

export const getStorySchema = {
  params: z.strictObject({ id: generalValidation.id }),
};

export const deleteStorySchema = getStorySchema;
