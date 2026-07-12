"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostService = void 0;
const mongoose_1 = require("mongoose");
const enums_1 = require("../../common/enums");
const exception_1 = require("../../common/exception");
const repository_1 = require("../../DB/repository");
class PostService {
    populate = [
        { path: "likes" },
        { path: "createdBy" },
        { path: "Tags" },
        { path: "updatedBy" },
        {
            path: "comments",
            populate: [{ path: "reply", populate: [{ path: "reply" }] }],
        },
    ];
    postRepository;
    commentRepository;
    notificationRepository;
    storyRepository;
    constructor() {
        this.postRepository = new repository_1.PostRepository();
        this.commentRepository = new repository_1.CommentRepository();
        this.notificationRepository = new repository_1.NotificationRepository();
        this.storyRepository = new repository_1.StoryRepository();
    }
    async postList(args, user) {
        const posts = await this.postRepository.find({
            filter: { deletedAt: null },
            options: {
                lean: true,
                populate: this.populate,
                sort: {
                    createdAt: -1,
                },
            },
        });
        return {
            docs: posts,
            currentPage: 1,
            pages: 1,
            size: posts.length,
        };
    }
    async createPost(data, user) {
        const payload = {
            ...data,
            createdBy: user._id,
            availability: data.availability ?? enums_1.AvailabilityEnum.PUBLIC,
            reactions: [],
        };
        return this.postRepository.createOne({ data: payload });
    }
    async listPosts() {
        return this.postRepository.find({
            filter: { deletedAt: null },
            options: {
                lean: true,
                sort: { createdAt: -1 },
                populate: [
                    { path: "createdBy", select: "firstName lastName profilePicture" },
                    { path: "likes", select: "firstName lastName profilePicture" },
                    { path: "tags", select: "firstName lastName profilePicture" },
                ],
            },
        });
    }
    async listFeed(user) {
        return this.postRepository.find({
            filter: { deletedAt: null },
            options: {
                lean: true,
                sort: { createdAt: -1 },
                populate: [
                    { path: "createdBy", select: "firstName lastName profilePicture" },
                    { path: "likes", select: "firstName lastName profilePicture" },
                    { path: "tags", select: "firstName lastName profilePicture" },
                ],
            },
        });
    }
    async listUserPostsById(userId) {
        return this.postRepository.find({
            filter: { createdBy: userId, deletedAt: null },
            options: {
                lean: true,
                sort: { createdAt: -1 },
            },
        });
    }
    async listUserPosts(user) {
        return this.postRepository.find({
            filter: { createdBy: user._id, deletedAt: null },
            options: {
                lean: true,
                sort: { createdAt: -1 },
            },
        });
    }
    async getPostById(id) {
        const post = await this.postRepository.findbyId({
            _id: new mongoose_1.Types.ObjectId(id),
            options: {
                populate: [
                    { path: "createdBy", select: "firstName lastName profilePicture" },
                    { path: "likes", select: "firstName lastName profilePicture" },
                    { path: "tags", select: "firstName lastName profilePicture" },
                ],
            },
        });
        if (!post || post.deletedAt) {
            throw new exception_1.NotFoundExeption("Post not found");
        }
        return post;
    }
    async updatePost(id, data, user) {
        if (Object.keys(data).length === 0) {
            throw new exception_1.BadRequestExaption("No data provided to update");
        }
        const post = await this.postRepository.findbyId({ _id: new mongoose_1.Types.ObjectId(id) });
        if (!post || post.deletedAt) {
            throw new exception_1.NotFoundExeption("Post not found");
        }
        const ownerId = post.createdBy?.toString();
        if (ownerId !== user._id.toString()) {
            throw new exception_1.ForbiddenExeption("You are not allowed to update this post");
        }
        const updated = await this.postRepository.findOneAndUpdate({
            filter: { _id: id },
            update: {
                ...data,
                updatedBy: user._id,
            },
        });
        if (!updated) {
            throw new exception_1.NotFoundExeption("Failed to update post");
        }
        return updated;
    }
    async deletePost(id, user) {
        const post = await this.postRepository.findbyId({ _id: new mongoose_1.Types.ObjectId(id) });
        if (!post || post.deletedAt) {
            throw new exception_1.NotFoundExeption("Post not found");
        }
        const ownerId = post.createdBy?.toString();
        if (ownerId !== user._id.toString()) {
            throw new exception_1.ForbiddenExeption("You are not allowed to delete this post");
        }
        const deleted = await this.postRepository.findOneAndUpdate({
            filter: { _id: id },
            update: { deletedAt: new Date() },
        });
        if (!deleted) {
            throw new exception_1.NotFoundExeption("Failed to delete post");
        }
        return deleted;
    }
    async Like(id, user) {
        const post = await this.postRepository.findbyId({ _id: new mongoose_1.Types.ObjectId(id) });
        if (!post || post.deletedAt) {
            throw new exception_1.NotFoundExeption("Post not found");
        }
        const userId = user._id.toString();
        const likes = (post.likes || []).map((like) => like.toString());
        const liked = likes.includes(userId);
        const updatedLikes = liked
            ? likes.filter((like) => like !== userId)
            : [...likes, userId].map((value) => new mongoose_1.Types.ObjectId(value));
        const updated = await this.postRepository.findOneAndUpdate({
            filter: { _id: id },
            update: {
                likes: updatedLikes,
            },
        });
        if (!updated) {
            throw new exception_1.NotFoundExeption("Failed to update likes");
        }
        return updated;
    }
    async Reaction(id, emoji, user) {
        const post = await this.postRepository.findbyId({ _id: new mongoose_1.Types.ObjectId(id) });
        if (!post || post.deletedAt) {
            throw new exception_1.NotFoundExeption("Post not found");
        }
        const existingReactions = (post.reactions || []);
        const currentUserId = user._id.toString();
        const updatedReactions = [...existingReactions];
        const existingIndex = updatedReactions.findIndex((reaction) => reaction.emoji === emoji &&
            reaction.userId.toString() === currentUserId);
        if (existingIndex >= 0) {
            updatedReactions.splice(existingIndex, 1);
        }
        else {
            updatedReactions.push({ emoji, userId: user._id });
        }
        const updated = await this.postRepository.findOneAndUpdate({
            filter: { _id: id },
            update: { reactions: updatedReactions },
        });
        if (!updated) {
            throw new exception_1.NotFoundExeption("Failed to update reaction");
        }
        return updated;
    }
    async dashboard(user) {
        const [posts, comments, notifications, stories] = await Promise.all([
            this.postRepository.find({ filter: { createdBy: user._id, deletedAt: null } }),
            this.commentRepository.find({ filter: { createdBy: user._id, deletedAt: null } }),
            this.notificationRepository.find({
                filter: { recipientId: user._id, isRead: false, deletedAt: null },
            }),
            this.storyRepository.find({ filter: { createdBy: user._id, deletedAt: null } }),
        ]);
        return {
            postCount: posts.length,
            commentCount: comments.length,
            unreadNotifications: notifications.length,
            activeStories: stories.length,
        };
    }
    reactPost = async (args, user) => {
        const updatedPost = await this.postRepository.findOneAndUpdate({
            filter: { _id: args.postID },
            update: {
                $push: {
                    reactions: {
                        emoji: args.react,
                        userId: user._id,
                    },
                },
            },
        });
        if (!updatedPost) {
            throw new exception_1.BadRequestExaption("Failed to react to post");
        }
        return updatedPost;
    };
}
exports.PostService = PostService;
exports.default = new PostService();
