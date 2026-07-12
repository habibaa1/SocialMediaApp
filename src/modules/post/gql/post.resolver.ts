import { IAuthUser } from "../../../common/types/express.types";

import {
  PaginateDto,
  paginationValidationSchema,
} from "../../../common/validation";

import { GQLValidation } from "../../../middleware";

import { ReactOnPostArgsDto } from "../post.dto";

import { PostService } from "../post.service";

import { reactOnPostGQL } from "../post.validation";

export class PostResolver {

  private postService: PostService;

  constructor() {
    this.postService = new PostService();
  }

  postlist = async (
    parent: unknown,
    args: PaginateDto,
    context: IAuthUser
  ) => {

    await GQLValidation<PaginateDto>(
      paginationValidationSchema.query,
      args
    );

    if (!context.user) {
      throw new Error("Unauthorized");
    }

    const data = await this.postService.postList(
      args,
      context.user
    );

    return {
      message: "Done",
      data,
    };
  };

  reactOnPost = async (
  parent: unknown,
  { postID, react }: ReactOnPostArgsDto,
  { user }: IAuthUser
) => {

  await GQLValidation<ReactOnPostArgsDto>(
    reactOnPostGQL,
    { postID, react }
  );

  const data = await this.postService.reactPost(
    { postID, react },
    user
  );

  return {
    message: "Done",
    data,
  };
};
}

export const postResolver = new PostResolver();