"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.postService = exports.PostService = void 0;
const services_1 = require("../../common/services");
const repository_1 = require("../../DB/repository");
const domain_exception_1 = require("../../common/exception/domain.exception");
const crypto_1 = require("crypto");
const post_1 = require("../../common/utils/post");
const objectid_1 = require("../../common/utils/objectid");
class PostService {
    redis;
    userRepository;
    postRepository;
    notification;
    s3;
    constructor() {
        this.userRepository = new repository_1.UserRepository();
        this.postRepository = new repository_1.PostRepository();
        this.redis = services_1.redisService;
        this.notification = services_1.notificationService;
        this.s3 = new services_1.S3Service();
    }
    async postList({ page, size, search }, user) {
        const posts = await this.postRepository.paginate({
            filter: {
                $or: (0, post_1.getAvailability)(user),
                ...(search?.length ? { content: { $regex: search, $options: "i" } } : {})
            },
            page, size,
            options: {
                populate: [{ path: "comments", populate: [{ path: "reply", populate: [{ path: "reply" }] }] }]
            }
        });
        return posts;
    }
    async createPost({ availability, content, files, tags }, user) {
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
        const folderId = (0, crypto_1.randomUUID)();
        let attachments = [];
        if (files?.length) {
            attachments = await this.s3.uploadAssets({
                files: files,
                path: `Post/${folderId}`
            });
        }
        const post = await this.postRepository.createOne({
            data: {
                createdBy: user._id,
                content: content,
                attachments,
                folderId,
                availability,
                tags: mentions
            }
        });
        if (!post) {
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
                        message: `${user.username} mentioned you in his post`,
                        postId: post._id
                    })
                }
            });
        }
        return post.toJSON();
    }
    async updatePost({ postId }, { availability, content, files = [], tags = [], removeFiles = [], removeTags = [] }, user) {
        const post = await this.postRepository.findOne({
            filter: { _id: postId, createdBy: user._id }
        });
        if (!post) {
            throw new domain_exception_1.NotFoundExeption("Fail to find matching post");
        }
        if (!post.content && !content && !files?.length && post.attachments?.length == removeFiles.length) {
            throw new domain_exception_1.BadRequestExaption("We cannot leave empty post");
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
        const folderId = (0, crypto_1.randomUUID)();
        let attachments = [];
        if (files?.length) {
            attachments = await this.s3.uploadAssets({
                files: files,
                path: `Post/${folderId}`
            });
        }
        const updatedPost = await this.postRepository.findOneAndUpdate({
            filter: {
                _id: postId,
                createdBy: user._id
            },
            update: [
                {
                    $set: {
                        content: content || post.content,
                        availability: Number(availability) || post.availability,
                        updatedBy: user._id,
                        attachments: {
                            $setUnion: [
                                {
                                    $setDifference: [
                                        "$attachments",
                                        removeFiles
                                    ]
                                },
                                attachments
                            ]
                        },
                        tags: {
                            $setUnion: [
                                {
                                    $setDifference: [
                                        "$tags",
                                        removeTags.map(ele => { return (0, objectid_1.toObjectId)(ele); })
                                    ]
                                },
                                mentions
                            ]
                        }
                    }
                }
            ]
        });
        if (!updatedPost) {
            if (attachments.length) {
                await this.s3.deleteAssets({
                    Keys: attachments.map(ele => {
                        return { Key: ele };
                    })
                });
            }
            throw new domain_exception_1.BadRequestExaption("Fail");
        }
        if (removeFiles.length) {
            await this.s3.deleteAssets({
                Keys: removeFiles.map(ele => {
                    return { Key: ele };
                })
            });
        }
        if (FCM_Tokens.length) {
            await this.notification.sendNotifications({
                tokens: FCM_Tokens, data: {
                    title: "Post mention",
                    body: JSON.stringify({
                        message: `${user.username} mentioned you in his post`,
                        postId: post._id
                    })
                }
            });
        }
        return updatedPost.toJSON();
    }
    async reactPost({ postId }, { react }, user) {
        const post = await this.postRepository.findOneAndUpdate({
            filter: {
                _id: postId,
                $or: (0, post_1.getAvailability)(user),
            },
            update: {
                ...(Number(react) > 0 ? { $addToSet: { likes: user._id } } : { $pull: { likes: user._id } })
            }
        });
        if (!post) {
            throw new domain_exception_1.NotFoundExeption("Fail to find matching post");
        }
        return post.toJSON();
    }
}
exports.PostService = PostService;
exports.postService = new PostService();
