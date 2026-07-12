"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StoryService = void 0;
const mongoose_1 = require("mongoose");
const exception_1 = require("../../common/exception");
const repository_1 = require("../../DB/repository");
const enums_1 = require("../../common/enums");
class StoryService {
    storyRepository;
    constructor() {
        this.storyRepository = new repository_1.StoryRepository();
    }
    async createStory(data, user) {
        if (!data.text && !data.attachments?.length) {
            throw new exception_1.BadRequestExaption("Story must contain text or attachments");
        }
        const payload = {
            ...data,
            createdBy: user._id,
            type: data.type ?? enums_1.StoryTypeEnum.IMAGE,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        };
        return this.storyRepository.createOne({ data: payload });
    }
    async listFeedStories() {
        return this.storyRepository.find({
            filter: { deletedAt: null },
            options: {
                lean: true,
                sort: { createdAt: -1 },
                populate: [
                    { path: "createdBy", select: "firstName lastName profilePicture" },
                ],
            },
        });
    }
    async listOwnStories(user) {
        return this.storyRepository.find({
            filter: { createdBy: user._id, deletedAt: null },
            options: {
                lean: true,
                sort: { createdAt: -1 },
            },
        });
    }
    async getStoryById(id) {
        const story = await this.storyRepository.findbyId({ _id: new mongoose_1.Types.ObjectId(id) });
        if (!story || story.deletedAt) {
            throw new exception_1.NotFoundExeption("Story not found");
        }
        return story;
    }
    async deleteStory(id, user) {
        const story = await this.storyRepository.findbyId({ _id: new mongoose_1.Types.ObjectId(id) });
        if (!story || story.deletedAt) {
            throw new exception_1.NotFoundExeption("Story not found");
        }
        const ownerId = story.createdBy?.toString();
        if (ownerId !== user._id.toString()) {
            throw new exception_1.ForbiddenExeption("You are not allowed to delete this story");
        }
        const deleted = await this.storyRepository.updateOne({
            filter: { _id: new mongoose_1.Types.ObjectId(id) },
            update: { deletedAt: new Date() },
        });
        if (!deleted) {
            throw new exception_1.NotFoundExeption("Failed to delete story");
        }
        return deleted;
    }
}
exports.StoryService = StoryService;
exports.default = new StoryService();
