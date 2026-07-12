import { z } from "zod";
import {
  createStorySchema,
  deleteStorySchema,
  getStorySchema,
} from "./story.validation";

export type CreateStoryDto = z.infer<typeof createStorySchema.body>;
export type GetStoryDto = z.infer<typeof getStorySchema.params>;
export type DeleteStoryDto = z.infer<typeof deleteStorySchema.params>;
