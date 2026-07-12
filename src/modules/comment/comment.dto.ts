import { z } from "zod";
import {
  createCommentSchema,
  deleteCommentSchema,
  getCommentSchema,
  listPostCommentsSchema,
  reactCommentSchema,
  replyCommentSchema,
  updateCommentSchema,
} from "./comment.validation";

export type CreateCommentDto = z.infer<typeof createCommentSchema.body>;
export type UpdateCommentDto = z.infer<typeof updateCommentSchema.body>;
export type CommentIdDto = z.infer<typeof getCommentSchema.params>;
export type ListPostCommentsDto = z.infer<typeof listPostCommentsSchema.params>;
export type ReactCommentDto = z.infer<typeof reactCommentSchema.body>;
export type DeleteCommentDto = z.infer<typeof deleteCommentSchema.params>;
export type ReplyCommentDto = z.infer<typeof replyCommentSchema.body>;
