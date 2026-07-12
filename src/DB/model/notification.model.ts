import { model, models, Schema } from "mongoose";
import { INotification } from "../../common/interfaces";
import { HydratedDocument } from "mongoose";
import {
  NotificationAudienceEnum,
  NotificationTypeEnum,
} from "../../common/enums";

export type NotificationDocument = HydratedDocument<INotification>;

const notificationSchema = new Schema<INotification>(
  {
    title: { type: String, required: true },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    recipientId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    audience: {
      type: String,
      enum: Object.values(NotificationAudienceEnum),
      default: NotificationAudienceEnum.USER,
    },
    type: {
      type: String,
      enum: Object.values(NotificationTypeEnum),
      required: true,
    },
    relatedEntityId: {
      type: Schema.Types.ObjectId,
      default: null,
    },
    relatedEntityType: {
      type: String,
      enum: ["POST", "COMMENT", "REPLY", "STORY", "USER"],
      default: null,
    },
    message: { type: String },
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    readAt: { type: Date, default: null },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  },
);

export const NotificationModel =
  models.Notification ||
  model<INotification>("Notification", notificationSchema);
