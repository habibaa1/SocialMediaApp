import { HydratedDocument, Types } from "mongoose";
import { IComment, IUser } from "../../common/interfaces";
import { ForbiddenExeption, NotFoundExeption } from "../../common/exception";
import {
  CommentRepository,
  NotificationRepository,
  PostRepository,
} from "../../DB/repository";
import {
  CreateCommentDto,
  UpdateCommentDto,
  ReactCommentDto,
} from "./comment.dto";
import { NotificationTypeEnum } from "../../common/enums";

export class CommentService {
  private readonly commentRepository: CommentRepository;
  private readonly postRepository: PostRepository;
  private readonly notificationRepository: NotificationRepository;

  constructor() {
    this.commentRepository = new CommentRepository();
    this.postRepository = new PostRepository();
    this.notificationRepository = new NotificationRepository();
  }

  async createComment(
    data: CreateCommentDto,
    user: HydratedDocument<IUser>,
  ): Promise<IComment> {
    const post = await this.postRepository.findOne({
      filter: { _id: data.postId },
    });
    if (!post || (post as any).deletedAt) {
      throw new NotFoundExeption("Post not found");
    }

    const payload = {
      postId: new Types.ObjectId(data.postId),
      content: data.content,
      attachments: data.attachments || [],
      createdBy: user._id,
      replies: [],
    };

    const comment = await this.commentRepository.createOne({ data: payload });

    const recipientId = (post.createdBy as any).toString();
    if (recipientId !== user._id.toString()) {
      await this.notificationRepository.createOne({
        data: {
          title: "Someone commented on your post",
          message: data.content,
          senderId: user._id,
          recipientId: new Types.ObjectId(recipientId),
          type: NotificationTypeEnum.COMMENT,
          relatedEntityId: comment._id,
          relatedEntityType: "POST",
          isRead: false,
        },
      });
    }

    return comment;
  }

  async replyToComment(
    parentCommentId: string,
    data: { content: string; attachments?: string[] },
    user: HydratedDocument<IUser>,
  ): Promise<IComment> {
    const parentComment = await this.commentRepository.findOne({
      filter: { _id: parentCommentId },
    });
    if (!parentComment || (parentComment as any).deletedAt) {
      throw new NotFoundExeption("Parent comment not found");
    }

    const replyData = {
      createdBy: user._id,
      content: data.content,
      attachments: data.attachments || [],
      reactions: [],
    };

    const updatedComment = await this.commentRepository.updateOne({
      filter: { _id: parentCommentId },
      update: {
        $push: { replies: replyData },
      },
    });

    if (!updatedComment.matchedCount) {
      throw new NotFoundExeption("Failed to add reply");
    }

    const recipientId = (parentComment.createdBy as any).toString();
    if (recipientId !== user._id.toString()) {
      await this.notificationRepository.createOne({
        data: {
          title: "Someone replied to your comment",
          message: data.content,
          senderId: user._id,
          recipientId: new Types.ObjectId(recipientId),
          type: NotificationTypeEnum.REPLY,
          relatedEntityId: parentComment._id,
          relatedEntityType: "COMMENT",
          isRead: false,
        },
      });
    }

    const updatedParentComment = await this.commentRepository.findOne({
      filter: { _id: parentCommentId },
      options: {
        populate: [
          { path: "createdBy", select: "firstName lastName profilePicture" },
          {
            path: "replies.createdBy",
            select: "firstName lastName profilePicture",
          },
        ],
      },
    });

    if (!updatedParentComment) {
      throw new NotFoundExeption("Parent comment not found");
    }

    return updatedParentComment;
  }

  async listPostComments(postId: string): Promise<IComment[]> {
    return this.commentRepository.find({
      filter: { postId, deletedAt: null },
      options: {
        lean: true,
        sort: { createdAt: 1 },
        populate: [
          { path: "createdBy", select: "firstName lastName profilePicture" },
          {
            path: "replies.createdBy",
            select: "firstName lastName profilePicture",
          },
        ],
      },
    });
  }

  async getCommentById(id: string): Promise<IComment> {
    const comment = await this.commentRepository.findOne({
      filter: { _id: id },
      options: {
        populate: [
          { path: "createdBy", select: "firstName lastName profilePicture" },
          {
            path: "replies.createdBy",
            select: "firstName lastName profilePicture",
          },
        ],
      },
    });
    if (!comment || (comment as any).deletedAt) {
      throw new NotFoundExeption("Comment not found");
    }
    return comment;
  }

  async updateComment(
    id: string,
    data: UpdateCommentDto,
    user: HydratedDocument<IUser>,
  ): Promise<IComment> {
    const comment = await this.commentRepository.findOne({
      filter: { _id: id },
    });
    if (!comment || (comment as any).deletedAt) {
      throw new NotFoundExeption("Comment not found");
    }

    const ownerId = (comment.createdBy as any).toString();
    if (ownerId !== user._id.toString()) {
      throw new ForbiddenExeption("You cannot update this comment");
    }

    const updated = await this.commentRepository.updateOne({
      filter: { _id: id },
      update: {
        $set: {
          ...data,
        },
      },
    });

    if (!updated.matchedCount) {
      throw new NotFoundExeption("Failed to update comment");
    }

    return this.getCommentById(id);
  }

  async deleteComment(
    id: string,
    user: HydratedDocument<IUser>,
  ): Promise<IComment> {
    const comment = await this.commentRepository.findOne({
      filter: { _id: id },
    });
    if (!comment || (comment as any).deletedAt) {
      throw new NotFoundExeption("Comment not found");
    }

    const ownerId = (comment.createdBy as any).toString();
    if (ownerId !== user._id.toString()) {
      throw new ForbiddenExeption("You cannot delete this comment");
    }

    const deleted = await this.commentRepository.updateOne({
      filter: { _id: id },
      update: { deletedAt: new Date() },
    });

    if (!deleted.matchedCount) {
      throw new NotFoundExeption("Failed to delete comment");
    }
    comment.deletedAt = new Date();
    return comment;
  }

  async reaction(
    id: string,
    data: ReactCommentDto,
    user: HydratedDocument<IUser>,
  ): Promise<IComment> {
    const comment = await this.commentRepository.findOne({
      filter: { _id: id },
    });
    if (!comment || (comment as any).deletedAt) {
      throw new NotFoundExeption("Comment not found");
    }

    const existingReactions = ((comment as IComment & { reactions?: unknown[] })
      .reactions || []) as Array<{
      emoji: string;
      userId: Types.ObjectId;
    }>;

    const emoji = data.emoji;
    const existingIndex = existingReactions.findIndex(
      (item) =>
        item.emoji === emoji && item.userId.toString() === user._id.toString(),
    );
    const reactions = [...existingReactions];

    if (existingIndex >= 0) {
      reactions.splice(existingIndex, 1);
    } else {
      reactions.push({ emoji, userId: user._id as Types.ObjectId });
    }

    const updated = await this.commentRepository.updateOne({
      filter: { _id: id },
      update: { reactions },
    });

    if (!updated.matchedCount) {
      throw new NotFoundExeption("Failed to update reaction");
    }
    return this.getCommentById(id);
  }
}

export default new CommentService();
