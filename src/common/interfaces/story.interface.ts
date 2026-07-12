import { Types } from "mongoose";
import { IUser } from "./user.interface";

export interface IStory {
  _id?: object;
  createdBy: Types.ObjectId | IUser;
  text?: string;
  attachments?: string[];
  type: "IMAGE" | "VIDEO" | "TEXT";
  expiresAt: Date;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt?: Date;
}
