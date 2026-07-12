"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommentService = void 0;
const mongoose_1 = require("mongoose");
const exception_1 = require("../../common/exception");
const repository_1 = require("../../DB/repository");
const enums_1 = require("../../common/enums");
class CommentService {
    commentRepository;
    postRepository;
    notificationRepository;
    constructor() {
        this.commentRepository = new repository_1.CommentRepository();
        this.postRepository = new repository_1.PostRepository();
        this.notificationRepository = new repository_1.NotificationRepository();
    }
    async createComment(data, user) {
        const post = await this.postRepository.findOne({
            filter: { _id: data.postId },
        });
        if (!post || post.deletedAt) {
            throw new exception_1.NotFoundExeption("Post not found");
        }
        const payload = {
            postId: new mongoose_1.Types.ObjectId(data.postId),
            content: data.content,
            attachments: data.attachments || [],
            createdBy: user._id,
            replies: [],
        };
        const comment = await this.commentRepository.createOne({ data: payload });
        const recipientId = post.createdBy.toString();
        if (recipientId !== user._id.toString()) {
            await this.notificationRepository.createOne({
                data: {
                    title: "Someone commented on your post",
                    message: data.content,
                    senderId: user._id,
                    recipientId: new mongoose_1.Types.ObjectId(recipientId),
                    type: enums_1.NotificationTypeEnum.COMMENT,
                    relatedEntityId: comment._id,
                    relatedEntityType: "POST",
                    isRead: false,
                },
            });
        }
        return comment;
    }
    async replyToComment(parentCommentId, data, user) {
        const parentComment = await this.commentRepository.findOne({
            filter: { _id: parentCommentId },
        });
        if (!parentComment || parentComment.deletedAt) {
            throw new exception_1.NotFoundExeption("Parent comment not found");
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
            throw new exception_1.NotFoundExeption("Failed to add reply");
        }
        const recipientId = parentComment.createdBy.toString();
        if (recipientId !== user._id.toString()) {
            await this.notificationRepository.createOne({
                data: {
                    title: "Someone replied to your comment",
                    message: data.content,
                    senderId: user._id,
                    recipientId: new mongoose_1.Types.ObjectId(recipientId),
                    type: enums_1.NotificationTypeEnum.REPLY,
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
            throw new exception_1.NotFoundExeption("Parent comment not found");
        }
        return updatedParentComment;
    }
    async listPostComments(postId) {
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
    async getCommentById(id) {
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
        if (!comment || comment.deletedAt) {
            throw new exception_1.NotFoundExeption("Comment not found");
        }
        return comment;
    }
    async updateComment(id, data, user) {
        const comment = await this.commentRepository.findOne({
            filter: { _id: id },
        });
        if (!comment || comment.deletedAt) {
            throw new exception_1.NotFoundExeption("Comment not found");
        }
        const ownerId = comment.createdBy.toString();
        if (ownerId !== user._id.toString()) {
            throw new exception_1.ForbiddenExeption("You cannot update this comment");
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
            throw new exception_1.NotFoundExeption("Failed to update comment");
        }
        return this.getCommentById(id);
    }
    async deleteComment(id, user) {
        const comment = await this.commentRepository.findOne({
            filter: { _id: id },
        });
        if (!comment || comment.deletedAt) {
            throw new exception_1.NotFoundExeption("Comment not found");
        }
        const ownerId = comment.createdBy.toString();
        if (ownerId !== user._id.toString()) {
            throw new exception_1.ForbiddenExeption("You cannot delete this comment");
        }
        const deleted = await this.commentRepository.updateOne({
            filter: { _id: id },
            update: { deletedAt: new Date() },
        });
        if (!deleted.matchedCount) {
            throw new exception_1.NotFoundExeption("Failed to delete comment");
        }
        comment.deletedAt = new Date();
        return comment;
    }
    async reaction(id, data, user) {
        const comment = await this.commentRepository.findOne({
            filter: { _id: id },
        });
        if (!comment || comment.deletedAt) {
            throw new exception_1.NotFoundExeption("Comment not found");
        }
        const existingReactions = (comment
            .reactions || []);
        const emoji = data.emoji;
        const existingIndex = existingReactions.findIndex((item) => item.emoji === emoji && item.userId.toString() === user._id.toString());
        const reactions = [...existingReactions];
        if (existingIndex >= 0) {
            reactions.splice(existingIndex, 1);
        }
        else {
            reactions.push({ emoji, userId: user._id });
        }
        const updated = await this.commentRepository.updateOne({
            filter: { _id: id },
            update: { reactions },
        });
        if (!updated.matchedCount) {
            throw new exception_1.NotFoundExeption("Failed to update reaction");
        }
        return this.getCommentById(id);
    }
}
exports.CommentService = CommentService;
exports.default = new CommentService();
