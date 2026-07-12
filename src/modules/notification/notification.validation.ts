import { z } from "zod";
import { generalValidation } from "../../common/validation";
import {
  NotificationAudienceEnum,
  NotificationTypeEnum,
} from "../../common/Enums";

export const createNotificationSchema = {
  body: z
    .strictObject({
      title: z.string().min(1),
      message: z.string().min(1),
      audience: z.nativeEnum(NotificationAudienceEnum).optional(),
      recipientId: generalValidation.id.optional(),
      type: z.nativeEnum(NotificationTypeEnum).optional(),
    })
    .refine(
      (value) =>
        value.audience === NotificationAudienceEnum.ALL ||
        Boolean(value.recipientId),
      {
        message: "recipientId is required when audience is USER",
      },
    ),
};

export const updateNotificationSchema = {
  params: z.strictObject({ id: generalValidation.id }),
  body: z
    .strictObject({
      title: z.string().min(1).optional(),
      message: z.string().min(1).optional(),
      isRead: z.boolean().optional(),
    })
    .refine((value) => Object.keys(value).length > 0, {
      message: "Please provide a field to update",
    }),
};

export const getNotificationSchema = {
  params: z.strictObject({ id: generalValidation.id }),
};

export const markReadSchema = {
  params: z.strictObject({ id: generalValidation.id }),
};

export const deleteNotificationSchema = getNotificationSchema;
