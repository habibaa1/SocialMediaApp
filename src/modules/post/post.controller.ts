import { NextFunction, Request, Response, Router } from "express";
import { authentication, validation } from "../../middleware";
import { successResponse } from "../../common/response";
import postService from "./post.service";
import * as validators from "./post.validation";

const router = Router();

router.post(
  "/",
  authentication(),
  validation(validators.createPostSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await postService.createPost(req.body, req.user);
      return successResponse({
        res,
        status: 201,
        message: "Post created successfully",
        data,
      });
    } catch (error) {
      return next(error);
    }
  },
);

router.get(
  "/feed",
  authentication(),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await postService.listFeed(req.user);
      return successResponse({ res, data });
    } catch (error) {
      return next(error);
    }
  },
);

router.get(
  "/dashboard",
  authentication(),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await postService.dashboard(req.user);
      return successResponse({ res, data });
    } catch (error) {
      return next(error);
    }
  },
);

router.get(
  "/profile/:id",
  authentication(),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await postService.listUserPostsById(String(req.params.id));
      return successResponse({ res, data });
    } catch (error) {
      return next(error);
    }
  },
);

router.get(
  "/",
  authentication(),

  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await postService.listPosts();
      return successResponse({ res, data });
    } catch (error) {
      return next(error);
    }
  },
);

router.get(
  "/mine",
  authentication(),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await postService.listUserPosts(req.user);
      return successResponse({ res, data });
    } catch (error) {
      return next(error);
    }
  },
);

router.get(
  "/:id",
  authentication(),
  validation(validators.getPostSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await postService.getPostById(String(req.params.id));
      return successResponse({ res, data });
    } catch (error) {
      return next(error);
    }
  },
);

router.patch(
  "/:id",
  authentication(),
  validation(validators.updatePostSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await postService.updatePost(
        String(req.params.id),
        req.body,
        req.user,
      );
      return successResponse({
        res,
        message: "Post updated successfully",
        data,
      });
    } catch (error) {
      return next(error);
    }
  },
);

router.delete(
  "/:id",
  authentication(),
  validation(validators.deletePostSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await postService.deletePost(String(req.params.id), req.user);
      return successResponse({
        res,
        message: "Post deleted successfully",
      });
    } catch (error) {
      return next(error);
    }
  },
);

router.post(
  "/:id/like",
  authentication(),
  validation(validators.likePostSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await postService.Like(String(req.params.id), req.user);
      return successResponse({
        res,
        message: data.likes?.length
          ? "Post like status updated"
          : "Like toggled",
        data,
      });
    } catch (error) {
      return next(error);
    }
  },
);

router.post(
  "/:id/react",
  authentication(),
  validation(validators.reactPostSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await postService.Reaction(
        String(req.params.id),
        req.body.emoji,
        req.user,
      );
      return successResponse({
        res,
        message: "Post reaction updated",
        data,
      });
    } catch (error) {
      return next(error);
    }
  },
);

export default router;
