import { NextFunction, Request, Response, Router } from "express";
import { authentication, validation } from "../../middleware";
import { successResponse } from "../../common/response";
import storyService from "./story.service";
import * as validators from "./story.validation";

const router = Router();

router.post(
  "/",
  authentication(),
  validation(validators.createStorySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await storyService.createStory(req.body, req.user);
      return successResponse({
        res,
        status: 201,
        message: "Story created successfully",
        data,
      });
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
      const data = await storyService.listFeedStories();
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
      const data = await storyService.listOwnStories(req.user);
      return successResponse({ res, data });
    } catch (error) {
      return next(error);
    }
  },
);

router.get(
  "/:id",
  authentication(),
  validation(validators.getStorySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await storyService.getStoryById(String(req.params.id));
      return successResponse({ res, data });
    } catch (error) {
      return next(error);
    }
  },
);

router.delete(
  "/:id",
  authentication(),
  validation(validators.deleteStorySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await storyService.deleteStory(String(req.params.id), req.user);
      return successResponse({
        res,
        message: "Story deleted successfully",
      });
    } catch (error) {
      return next(error);
    }
  },
);

export default router;
