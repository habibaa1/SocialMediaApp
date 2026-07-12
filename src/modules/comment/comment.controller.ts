import { NextFunction, Response, Router } from "express";
import { authentication, validation } from "../../middleware";
import { successResponse } from "../../common/response";
import { IAuthenticatedRequest } from "../../common/types/express.types";
import commentService from "./comment.service";
import * as validators from "./comment.validation";

const router = Router();

router.post(
  "/",
  authentication(),
  validation(validators.createCommentSchema),
  async (req: IAuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data = await commentService.createComment(req.body, req.user);
      return successResponse({
        res,
        status: 201,
        message: "Comment created successfully",
        data,
      });
    } catch (error) {
      return next(error);
    }
  },
);

router.get(
  "/post/:postId",
  authentication(),
  validation(validators.listPostCommentsSchema),
  async (req: IAuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data = await commentService.listPostComments(
        String(req.params.postId),
      );
      return successResponse({ res, data });
    } catch (error) {
      return next(error);
    }
  },
);

router.get(
  "/:id",
  authentication(),
  validation(validators.getCommentSchema),
  async (req: IAuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data = await commentService.getCommentById(String(req.params.id));
      return successResponse({ res, data });
    } catch (error) {
      return next(error);
    }
  },
);

router.patch(
  "/:id",
  authentication(),
  validation(validators.updateCommentSchema),
  async (req: IAuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data = await commentService.updateComment(
        String(req.params.id),
        req.body,
        req.user,
      );
      return successResponse({
        res,
        message: "Comment updated successfully",
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
  validation(validators.deleteCommentSchema),
  async (req: IAuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      await commentService.deleteComment(String(req.params.id), req.user);
      return successResponse({
        res,
        message: "Comment deleted successfully",
      });
    } catch (error) {
      return next(error);
    }
  },
);

router.post(
  "/:id/react",
  authentication(),
  validation(validators.reactCommentSchema),
  async (req: IAuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data = await commentService.reaction(
        String(req.params.id),
        req.body,
        req.user,
      );
      return successResponse({
        res,
        message: "Comment reaction updated",
        data,
      });
    } catch (error) {
      return next(error);
    }
  },
);

router.post(
  "/:id/reply",
  authentication(),
  validation(validators.replyCommentSchema),
  async (req: IAuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data = await commentService.replyToComment(
        String(req.params.id),
        req.body,
        req.user,
      );
      return successResponse({
        res,
        status: 201,
        message: "Reply created successfully",
        data,
      });
    } catch (error) {
      return next(error);
    }
  },
);

export default router;
