import { z } from "zod";
import {
  createPostSchema,
  deletePostSchema,
  getPostSchema,
  likePostSchema,
  reactOnPostGQL,
  updatePostSchema,
} from "./post.validation";

export type CreatePostDto = z.infer<typeof createPostSchema.body>;
export type UpdatePostDto = z.infer<typeof updatePostSchema.body>;
export type PostIdDto = z.infer<typeof getPostSchema.params>;
export type LikePostDto = z.infer<typeof likePostSchema.params>;

export type DeletePostDto = z.infer<typeof deletePostSchema.params>;
export type ReactOnPostArgsDto = z.infer<typeof reactOnPostGQL>;