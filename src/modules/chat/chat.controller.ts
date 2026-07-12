import { NextFunction, Request, Response, Router } from "express";
import { authentication } from "../../middleware";
import { validation } from "../../middleware";
import { successResponse } from "../../common/response";
import { chatService } from "./chat.service";
import { cloudFileUpload } from "../../common/utils/multer";
import { fileFieldValidation } from "../../common/utils/multer/validation.multer";
import { createGroup as createGroupValidation } from "./chat.validation";
const router = Router({ mergeParams: true });

router.get(
  "/",
  authentication(),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = {
        page: String((req.query as any).page ?? "1"),
        size: String((req.query as any).size ?? "10"),
      };

      const chat = await chatService.getChat(
        req.params.userId as string,
        query,
        req.user,
      );
      return successResponse({ res, data: { chat } });
    } catch (error) {
      return next(error);
    }
  },
);

router.get(
  "/group/:roomId",
  authentication(),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = {
        page: String((req.query as any).page ?? "1"),
        size: String((req.query as any).size ?? "10"),
      };

      const chat = await chatService.getGroupChat(
        req.params.roomId as string,
        query,
        req.user,
      );
      return successResponse({ res, data: { chat } });
    } catch (error) {
      return next(error);
    }
  },
);

router.post(
  "/group",
  authentication(),
  cloudFileUpload({ validation: fileFieldValidation.image }).single(
    "attachment",
  ),
  validation(createGroupValidation),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const chat = await chatService.createGroup(
        req.body,
        req.file as Express.Multer.File,
        req.user,
      );
      return successResponse({ res, data: { chat } });
    } catch (error) {
      return next(error);
    }
  },
);

export default router;
