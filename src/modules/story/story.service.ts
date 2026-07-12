import { HydratedDocument, Types } from "mongoose";
import { IStory, IUser } from "../../common/interfaces";
import {
  BadRequestExaption,
  ForbiddenExeption,
  NotFoundExeption,
} from "../../common/exception";
import { StoryRepository } from "../../DB/repository";
import { CreateStoryDto } from "./story.dto";
import { StoryTypeEnum } from "../../common/enums";

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
      throw new BadRequestExaption("Story must contain text or attachments");
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
    const story = await this.storyRepository.findbyId({ _id: new Types.ObjectId(id) });
    if (!story || (story as any).deletedAt) {
      throw new NotFoundExeption("Story not found");
    }
    return story as unknown as IStory;
  }

  async deleteStory(
    id: string,
    user: HydratedDocument<IUser>,
  ): Promise<IStory> {
    const story = await this.storyRepository.findbyId({ _id: new Types.ObjectId(id) });
    if (!story || (story as any).deletedAt) {
      throw new NotFoundExeption("Story not found");
    }

    const ownerId = (story as any).createdBy?.toString();
    if (ownerId !== user._id.toString()) {
      throw new ForbiddenExeption("You are not allowed to delete this story");
    }

    const deleted = await this.storyRepository.updateOne({
filter: { _id: new Types.ObjectId(id) },
      update: { deletedAt: new Date() },
    });

    if (!deleted) {
      throw new NotFoundExeption("Failed to delete story");
    }

    return deleted as unknown as IStory;
  }
}

export default new StoryService();
