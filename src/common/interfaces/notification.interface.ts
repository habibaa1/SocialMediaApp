import { Types } from "mongoose";
import { NotificationAudienceEnum, NotificationTypeEnum } from "../enums";

export interface INotification {
  _id?: object;
  title: string;
  senderId: Types.ObjectId;
  recipientId?: Types.ObjectId;
  audience?: NotificationAudienceEnum;
  type: NotificationTypeEnum;
  relatedEntityId?: Types.ObjectId;
  relatedEntityType?: "POST" | "COMMENT" | "REPLY" | "STORY" | "USER";
  message?: string;
  isRead: boolean;
  createdAt: Date;
  readAt?: Date;
  deletedAt?: Date | null;
}
