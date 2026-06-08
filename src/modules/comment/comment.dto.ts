import { z } from 'zod';
import { createComment, replyOnComment } from './comment.validation';

export type createCommentBodyDto = z.infer<typeof createComment.body>;
export type createCommentParamsDto = z.infer<typeof createComment.params>;
export type createReplyOnCommentParamsDto = z.infer<typeof replyOnComment.params>;




