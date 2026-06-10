import { Types } from "mongoose";
import { IUser } from "./user.interface";
import { ChatEnum } from "../enums/chat.enum";

export interface IMessage {
    content?: string;
    attachments?: string[];

    likes?: Types.ObjectId[] | IUser[];
    tags?: Types.ObjectId[] | IUser[];

    createdBy: Types.ObjectId | IUser;

    createdAt: Date;
    deletedAt?: Date;
    restoredAt?: Date;
    updatedAt?: Date;
}

export interface IChat {
    participants: Types.ObjectId[] | IUser[];
    messages: IMessage[];
    createdBy: Types.ObjectId | IUser;
    type: ChatEnum; // تأكدي من عمل import للـ ChatEnum لو مش معمولة فوق

    group?: string;
    group_image?: string;
    roomId?: string;

    createdAt: Date;
    deletedAt?: Date;
    restoredAt?: Date;
    updatedAt?: Date;
}