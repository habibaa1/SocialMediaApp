import { HydratedDocument, Types } from "mongoose";
import { INotification, IUser } from "../../common/interfaces";
import {
  BadRequestExaption,
  ForbiddenExeption,
  NotFoundExeption,
} from "../../common/exception";
import { NotificationRepository, UserRepository } from "../../DB/repository";
import {
  CreateNotificationDto,
  UpdateNotificationDto,
} from "./notification.dto";
import {
  NotificationAudienceEnum,
  NotificationTypeEnum,
} from "../../common/enums";
import { notificationService } from "../../common/services";
import { redisService } from "../../common/services/redis.service";

export class NotificationAppService {
  private readonly notificationRepository: NotificationRepository;
  private readonly userRepository: UserRepository;

  constructor() {
    this.notificationRepository = new NotificationRepository();
    this.userRepository = new UserRepository();
  }

  // ─── CREATE ────────────────────────────────────────────────────────────────
  // Admin only. Broadcasts to ALL users or targets a single recipient.

  async createNotification(
    data: CreateNotificationDto,
    user: HydratedDocument<IUser>,
  ): Promise<INotification[]> {
    if (user.role !== "ADMIN") {
      throw new ForbiddenExeption("Only admin can create notifications");
    }

    const audience = data.audience ?? NotificationAudienceEnum.USER;
    const type = data.type ?? NotificationTypeEnum.SYSTEM;

    if (audience === NotificationAudienceEnum.USER && !data.recipientId) {
      throw new BadRequestExaption(
        "recipientId is required when audience is USER",
      );
    }

    const payload = {
      title: data.title,
      message: data.message,
      senderId: user._id,
      type,
      audience,
      relatedEntityType: "USER",
      isRead: false,
    };

    if (audience === NotificationAudienceEnum.ALL) {
      return this._broadcastToAll(payload, data);
    }

    return this._sendToOne(payload, data);
  }

  // ─── LIST ──────────────────────────────────────────────────────────────────

  async listNotifications(
    user: HydratedDocument<IUser>,
  ): Promise<INotification[]> {
    return this.notificationRepository.find({
      filter: { recipientId: user._id, deletedAt: null },
      options: {
        lean: true,
        sort: { createdAt: -1 },
      },
    });
  }

  // ─── GET ONE ───────────────────────────────────────────────────────────────

  async getNotificationById(
    id: string,
    user: HydratedDocument<IUser>,
  ): Promise<INotification> {
    const notification = await this.notificationRepository.findOne({
filter: { _id: new Types.ObjectId(id), recipientId: user._id, deletedAt: null },    });
    if (!notification) {
      throw new NotFoundExeption("Notification not found");
    }
    return notification as unknown as INotification;
  }

  // ─── MARK AS READ ──────────────────────────────────────────────────────────

  async markAsRead(
    id: string,
    user: HydratedDocument<IUser>,
  ): Promise<INotification> {
    const notification = await this.notificationRepository.findOne({
filter: { _id: new Types.ObjectId(id), recipientId: user._id, deletedAt: null },    });
    if (!notification) {
      throw new NotFoundExeption("Notification not found");
    }

    if (notification.isRead) {
      return notification as INotification;
    }

    const updated = await this.notificationRepository.updateOne({
      filter: { _id: new Types.ObjectId(id) },
      update: { isRead: true, readAt: new Date() },
    });
    if (!updated) {
      throw new NotFoundExeption("Failed to update notification");
    }
    return updated as unknown as INotification;
  }

  // ─── MARK ALL AS READ ─────────────────────────────────────────────────────

  async markAllAsRead(user: HydratedDocument<IUser>): Promise<{ updated: number }> {
    const result = await this.notificationRepository.updateMany({
      filter: { recipientId: user._id, isRead: false, deletedAt: null },
      update: { isRead: true, readAt: new Date() },
    });
    return { updated: result.modifiedCount };
  }

  // ─── UPDATE ────────────────────────────────────────────────────────────────

  async updateNotification(
    id: string,
    data: UpdateNotificationDto,
    user: HydratedDocument<IUser>,
  ): Promise<INotification> {
    if (user.role !== "ADMIN") {
      throw new ForbiddenExeption("Only admin can update notifications");
    }

    const updated = await this.notificationRepository.updateOne({
      filter: { _id: new Types.ObjectId(id) },
      update: { $set: data },
    });
    if (!updated) {
      throw new NotFoundExeption("Notification not found");
    }
// عدل السطر 149 وخليه كده بالظبط:
return updated as unknown as INotification;  }

  // ─── DELETE (soft) ─────────────────────────────────────────────────────────
  async deleteNotification(
    id: string,
    user: HydratedDocument<IUser>,
  ): Promise<void> {
    if (user.role !== "ADMIN") {
      throw new ForbiddenExeption("Only admin can delete notifications");
    }
    await this.notificationRepository.deleteOne({ filter: { _id: new Types.ObjectId(id) } });
  }

  // ─── SOFT DELETE (user) ────────────────────────────────────────────────────
  async softDeleteNotification(
    id: string,
    user: HydratedDocument<IUser>,
  ): Promise<void> {
    const notification = await this.notificationRepository.findOne({
      filter: { _id: new Types.ObjectId(id), recipientId: user._id, deletedAt: null },
    });
    if (!notification) {
      throw new NotFoundExeption("Notification not found");
    }
    await this.notificationRepository.updateOne({
      filter: { _id: new Types.ObjectId(id) },
      update: { deletedAt: new Date() },
    });
  }

  // ─── UNREAD COUNT ──────────────────────────────────────────────────────────
  async unreadCount(user: HydratedDocument<IUser>): Promise<{ count: number }> {
const unreadNotifications = await this.notificationRepository.find({
  filter: { recipientId: user._id, isRead: false, deletedAt: null },
});
return { count: unreadNotifications.length };
  }

  // ─── HELPERS ───────────────────────────────────────────────────────

  private async _broadcastToAll(
    payload: object,
    data: CreateNotificationDto,
  ): Promise<INotification[]> {
    const users = await this.userRepository.find({
      filter: { deletedAt: null },
      projection: { _id: 1 },
    });
    if (!users.length) {
      throw new NotFoundExeption("No users available to notify");
    }

    const docs = users.map((recipient) => ({
      ...payload,
      recipientId: recipient._id as Types.ObjectId,
    }));

    await this.notificationRepository.create({ data: docs });

    const tokens = await redisService.getAllFCMTokens();
    if (tokens.length) {
      await notificationService.sendNotifications({
        tokens,
        data: { title: data.title, body: data.message },
      });
    }

    return docs as unknown as INotification[];
  }

  private async _sendToOne(
    payload: object,
    data: CreateNotificationDto,
  ): Promise<INotification[]> {
    const recipientId = String(data.recipientId);

    const recipient = await this.userRepository.findOne({
      filter: { _id: recipientId, deletedAt: null },
    });
    if (!recipient) {
      throw new NotFoundExeption("Recipient not found");
    }

    const doc = await this.notificationRepository.createOne({
      data: {
        ...payload,
        recipientId: new Types.ObjectId(recipientId),
      },
    });

    const tokens = await redisService.getFCMs(
      data.recipientId as unknown as string ,
    );
    if (tokens.length) {
      await notificationService.sendNotifications({
        tokens,
        data: { title: data.title, body: data.message },
      });
    }

    return [doc as INotification];
  }
}

export default new NotificationAppService();