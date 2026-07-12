import { HydratedDocument } from "mongoose";
import { IStory, IUser } from "../../common/interface";
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from "../../common/exceptions";
import { StoryRepository } from "../../DB/repository";
import { CreateStoryDto } from "./story.dto";
import { StoryTypeEnum } from "../../common/Enums";

export class StoryService {
  private readonly storyRepository: StoryRepository;

  constructor() {
    this.storyRepository = new StoryRepository();
  }

  async createStory(
    data: CreateStoryDto,
    user: HydratedDocument<IUser>,
  ): Promise<IStory> {
    if (!data.text && !data.attachments?.length) {
      throw new BadRequestException("Story must contain text or attachments");
    }

    const payload = {
      ...data,
      createdBy: user._id,
      type: data.type ?? StoryTypeEnum.IMAGE,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    };

    return this.storyRepository.createOne({ data: payload });
  }

  async listFeedStories(): Promise<IStory[]> {
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

  async listOwnStories(user: HydratedDocument<IUser>): Promise<IStory[]> {
    return this.storyRepository.find({
      filter: { createdBy: user._id, deletedAt: null },
      options: {
        lean: true,
        sort: { createdAt: -1 },
      },
    });
  }

  async getStoryById(id: string): Promise<IStory> {
    const story = await this.storyRepository.findById({ id });
    if (!story || (story as any).deletedAt) {
      throw new NotFoundException("Story not found");
    }
    return story as IStory;
  }

  async deleteStory(
    id: string,
    user: HydratedDocument<IUser>,
  ): Promise<IStory> {
    const story = await this.storyRepository.findById({ id });
    if (!story || (story as any).deletedAt) {
      throw new NotFoundException("Story not found");
    }

    const ownerId = (story.createdBy as any).toString();
    if (ownerId !== user._id.toString()) {
      throw new ForbiddenException("You are not allowed to delete this story");
    }

    const deleted = await this.storyRepository.updateOne({
      filter: { _id: id },
      update: { deletedAt: new Date() },
    });

    if (!deleted) {
      throw new NotFoundException("Failed to delete story");
    }

    return deleted as IStory;
  }
}

export default new StoryService();
