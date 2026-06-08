"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commentService = exports.CommentService = void 0;
const services_1 = require("../../common/services");
const repository_1 = require("../../DB/repository");
const domain_exception_1 = require("../../common/exception/domain.exception");
const post_1 = require("../../common/utils/post");
const objectid_1 = require("../../common/utils/objectid");
class CommentService {
    redis;
    userRepository;
    postRepository;
    notification;
    s3;
    commentRepository;
    constructor() {
        this.userRepository = new repository_1.UserRepository();
        this.postRepository = new repository_1.PostRepository();
        this.redis = services_1.redisService;
        this.notification = services_1.notificationService;
        this.s3 = new services_1.S3Service();
        this.commentRepository = new repository_1.CommentRepository();
    }
    async createComment({ postId }, { content, files, tags }, user) {
        const post = await this.postRepository.findOne({
            filter: {
                _id: postId,
                $or: (0, post_1.getAvailability)(user)
            }
        });
        if (!post) {
            throw new domain_exception_1.NotFoundExeption("Fail to find matching post");
        }
        const mentions = [];
        const FCM_Tokens = [];
        if (tags?.length) {
            const mentionedAccounts = await this.userRepository.find({
                filter: {
                    _id: { $in: tags }
                }
            });
            if (mentionedAccounts.length !== tags.length) {
                throw new domain_exception_1.NotFoundExeption("Fail to find some or all mentioned accounts");
            }
            for (const tag of tags) {
                mentions.push((0, objectid_1.toObjectId)(tag));
                (await this.redis.getFCMs(tag) || []).map(token => FCM_Tokens.push(token));
            }
        }
        const folderId = post.folderId;
        let attachments = [];
        if (files?.length) {
            attachments = await this.s3.uploadAssets({
                files: files,
                path: `Post/${folderId}`
            });
        }
        const comment = await this.commentRepository.createOne({
            data: {
                createdBy: user._id,
                content: content,
                attachments,
                postId: post._id,
                tags: mentions
            }
        });
        if (!comment) {
            if (attachments.length) {
                await this.s3.deleteAssets({
                    Keys: attachments.map(ele => {
                        return { Key: ele };
                    })
                });
            }
            throw new domain_exception_1.BadRequestExaption("Fail");
        }
        if (FCM_Tokens.length) {
            await this.notification.sendNotifications({
                tokens: FCM_Tokens, data: {
                    title: "Post mention",
                    body: JSON.stringify({
                        message: `${user.username} mentioned you in his comment`,
                        postId: post._id,
                        commentId: comment._id
                    })
                }
            });
        }
        return comment.toJSON();
    }
    async replyOnComment({ postId, commentId }, { content, files, tags }, user) {
        const comment = await this.commentRepository.findOne({
            filter: {
                _id: commentId,
                postId: postId,
            },
            options: {
                populate: [{
                        path: "postId",
                        match: {
                            $or: (0, post_1.getAvailability)(user)
                        }
                    }]
            }
        });
        if (!comment || !comment.postId) {
            throw new domain_exception_1.NotFoundExeption("Fail to find matching comment");
        }
        const mentions = [];
        const FCM_Tokens = [];
        if (tags?.length) {
            const mentionedAccounts = await this.userRepository.find({
                filter: {
                    _id: { $in: tags }
                }
            });
            if (mentionedAccounts.length !== tags.length) {
                throw new domain_exception_1.NotFoundExeption("Fail to find some or all mentioned accounts");
            }
            for (const tag of tags) {
                mentions.push((0, objectid_1.toObjectId)(tag));
                (await this.redis.getFCMs(tag) || []).map(token => FCM_Tokens.push(token));
            }
        }
        const post = comment.postId;
        const folderId = post.folderId;
        let attachments = [];
        if (files?.length) {
            attachments = await this.s3.uploadAssets({
                files: files,
                path: `Post/${folderId}`
            });
        }
        const reply = await this.commentRepository.createOne({
            data: {
                createdBy: user._id,
                content: content,
                attachments,
                postId: post._id,
                commentId: comment._id,
                tags: mentions
            }
        });
        if (!reply) {
            if (attachments.length) {
                await this.s3.deleteAssets({
                    Keys: attachments.map(ele => {
                        return { Key: ele };
                    })
                });
            }
            throw new domain_exception_1.BadRequestExaption("Fail");
        }
        if (FCM_Tokens.length) {
            await this.notification.sendNotifications({
                tokens: FCM_Tokens, data: {
                    title: "Post mention",
                    body: JSON.stringify({
                        message: `${user.username} mentioned you in his comment`,
                        postId: post._id,
                        commentId: comment._id,
                        replyId: reply._id
                    })
                }
            });
        }
        return reply.toJSON();
    }
}
exports.CommentService = CommentService;
exports.commentService = new CommentService();
