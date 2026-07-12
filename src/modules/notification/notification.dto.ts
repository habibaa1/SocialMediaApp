import { z } from "zod";
import {
  createNotificationSchema,
  deleteNotificationSchema,
  getNotificationSchema,
  markReadSchema,
  updateNotificationSchema,
} from "./notification.validation";

export type CreateNotificationDto = z.infer<
  typeof createNotificationSchema.body
>;
export type UpdateNotificationDto = z.infer<
  typeof updateNotificationSchema.body
>;
export type NotificationIdDto = z.infer<typeof getNotificationSchema.params>;
export type MarkReadDto = z.infer<typeof markReadSchema.params>;
export type DeleteNotificationDto = z.infer<
  typeof deleteNotificationSchema.params
>;
