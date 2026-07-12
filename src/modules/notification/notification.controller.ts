import { NextFunction, Request, Response, Router } from "express";
import { authentication, authorization, validation } from "../../middleware";
import { successResponse } from "../../common/response";
import notificationService from "./notification.service";
import * as validators from "./notification.validation";
import { endpoint } from "./notification.authorization";

const router = Router();

router.post(
  "/",
  authentication(),
  authorization(endpoint.manage),
  validation(validators.createNotificationSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await notificationService.createNotification(
        req.body,
        req.user,
      );
      return successResponse({
        res,
        status: 201,
        message: "Notification created successfully",
        data,
      });
    } catch (error) {
      return next(error);
    }
  },
);

router.get(
  "/notification-list",
  authentication(),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await notificationService.listNotifications(req.user);
      return successResponse({ res, data });
    } catch (error) {
      return next(error);
    }
  },
);

router.get(
  "/:id",
  authentication(),
  validation(validators.getNotificationSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await notificationService.getNotificationById(
        String(req.params.id),
        req.user,
      );
      return successResponse({ res, data });
    } catch (error) {
      return next(error);
    }
  },
);

router.patch(
  "/:id/read",
  authentication(),
  validation(validators.markReadSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await notificationService.markAsRead(
        String(req.params.id),
        req.user,
      );
      return successResponse({
        res,
        message: "Notification marked as read",
        data,
      });
    } catch (error) {
      return next(error);
    }
  },
);

router.patch(
  "/:id/update",
  authentication(),
  authorization(endpoint.manage),
  validation(validators.updateNotificationSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await notificationService.updateNotification(
        String(req.params.id),
        req.body,
        req.user,
      );
      return successResponse({
        res,
        message: "Notification updated successfully",
        data,
      });
    } catch (error) {
      return next(error);
    }
  },
);

router.delete(
  "/:id/delete",
  authentication(),
  authorization(endpoint.manage),
  validation(validators.deleteNotificationSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await notificationService.deleteNotification(
        String(req.params.id),
        req.user,
      );
      return successResponse({
        res,
        message: "Notification deleted successfully",
      });
    } catch (error) {
      return next(error);
    }
  },
);

export default router;
