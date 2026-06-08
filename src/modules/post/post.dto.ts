import { z } from 'zod';
import { createPost, reactPost, updatePost } from './post.validation';

export type createPostBodyDto = z.infer<typeof createPost.body>;
export type reactPostQueryDto = z.infer<typeof reactPost.query>;
export type reactPostParamsDto = z.infer<typeof reactPost.params>;
export type UpdatePostBodyDto = z.infer<typeof updatePost.body>
export type UpdatePostParamsDto = z.infer<typeof updatePost.params>


