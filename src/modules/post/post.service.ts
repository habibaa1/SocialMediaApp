import { HydratedDocument, PopulateOptions, Types } from "mongoose";
import { IPost, IUser } from "../../common/interface";
import { AvailabilityEnum } from "../../common/Enums";
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from "../../common/exceptions";
import {
  CommentRepository,
  NotificationRepository,
  PostRepository,
  StoryRepository,
} from "../../DB/repository";
import { CreatePostDto, UpdatePostDto } from "./post.dto";
import { IAuthUser } from "../../common/types/express.types";
import { PaginateDto } from "../../common/validation";
import { ReactOnPostArgsDto } from "./post.dto";

export class PostService {
  private populate: PopulateOptions[] = [
    { path: "likes" },
    { path: "createdBy" },
    { path: "Tags" },
    { path: "updatedBy" },
    {
      path: "comments",
      populate: [{ path: "reply", populate: [{ path: "reply" }] }],
    },
  ];

  private readonly postRepository: PostRepository;
  private readonly commentRepository: CommentRepository;
  private readonly notificationRepository: NotificationRepository;
  private readonly storyRepository: StoryRepository;

  constructor() {
    this.postRepository = new PostRepository();
    this.commentRepository = new CommentRepository();
    this.notificationRepository = new NotificationRepository();
    this.storyRepository = new StoryRepository();
  }
  async postList(args: PaginateDto, user: IAuthUser["user"]) {
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
  async createPost(
    data: CreatePostDto,
    user: HydratedDocument<IUser>,
  ): Promise<IPost> {
    const payload = {
      ...data,
      createdBy: user._id,
      availability: data.availability ?? AvailabilityEnum.PUBLIC,
      reactions: [],
    };

    return this.postRepository.createOne({ data: payload });
  }

  async listPosts(): Promise<IPost[]> {
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

  async listFeed(user: HydratedDocument<IUser>): Promise<IPost[]> {
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

  async listUserPostsById(userId: string): Promise<IPost[]> {
    return this.postRepository.find({
      filter: { createdBy: userId, deletedAt: null },
      options: {
        lean: true,
        sort: { createdAt: -1 },
      },
    });
  }

  async listUserPosts(user: HydratedDocument<IUser>): Promise<IPost[]> {
    return this.postRepository.find({
      filter: { createdBy: user._id, deletedAt: null },
      options: {
        lean: true,
        sort: { createdAt: -1 },
      },
    });
  }

  async getPostById(id: string): Promise<IPost> {
    const post = await this.postRepository.findById({
      id,
      options: {
        populate: [
          { path: "createdBy", select: "firstName lastName profilePicture" },
          { path: "likes", select: "firstName lastName profilePicture" },
          { path: "tags", select: "firstName lastName profilePicture" },
        ],
      },
    });

    if (!post || (post as any).deletedAt) {
      throw new NotFoundException("Post not found");
    }

    return post as IPost;
  }

  async updatePost(
    id: string,
    data: UpdatePostDto,
    user: HydratedDocument<IUser>,
  ): Promise<IPost> {
    if (Object.keys(data).length === 0) {
      throw new BadRequestException("No data provided to update");
    }

    const post = await this.postRepository.findById({ id });

    if (!post || (post as any).deletedAt) {
      throw new NotFoundException("Post not found");
    }

    const ownerId = (post.createdBy as any).toString();
    if (ownerId !== user._id.toString()) {
      throw new ForbiddenException("You are not allowed to update this post");
    }

    const updated = await this.postRepository.updateOne({
      filter: { _id: id },
      update: {
        ...data,
        updatedBy: user._id,
      },
    });

    if (!updated) {
      throw new NotFoundException("Failed to update post");
    }

    return updated as IPost;
  }

  async deletePost(id: string, user: HydratedDocument<IUser>): Promise<IPost> {
    const post = await this.postRepository.findById({ id });

    if (!post || (post as any).deletedAt) {
      throw new NotFoundException("Post not found");
    }

    const ownerId = (post.createdBy as any).toString();
    if (ownerId !== user._id.toString()) {
      throw new ForbiddenException("You are not allowed to delete this post");
    }

    const deleted = await this.postRepository.updateOne({
      filter: { _id: id },
      update: { deletedAt: new Date() },
    });

    if (!deleted) {
      throw new NotFoundException("Failed to delete post");
    }

    return deleted as IPost;
  }

  async Like(id: string, user: HydratedDocument<IUser>): Promise<IPost> {
    const post = await this.postRepository.findById({ id });

    if (!post || (post as any).deletedAt) {
      throw new NotFoundException("Post not found");
    }

    const userId = user._id.toString();
    const likes = ((post.likes || []) as Types.ObjectId[]).map((like) =>
      like.toString(),
    );

    const liked = likes.includes(userId);
    const updatedLikes = liked
      ? likes.filter((like) => like !== userId)
      : [...likes, userId].map((value) => new Types.ObjectId(value));

    const updated = await this.postRepository.updateOne({
      filter: { _id: id },
      update: {
        likes: updatedLikes,
      },
    });

    if (!updated) {
      throw new NotFoundException("Failed to update likes");
    }

    return updated as IPost;
  }

  async Reaction(
    id: string,
    emoji: string,
    user: HydratedDocument<IUser>,
  ): Promise<IPost> {
    const post = await this.postRepository.findById({ id });
    if (!post || (post as any).deletedAt) {
      throw new NotFoundException("Post not found");
    }

    const existingReactions = (post.reactions || []) as Array<{
      emoji: string;
      userId: Types.ObjectId;
    }>;

    const currentUserId = user._id.toString();
    const updatedReactions = [...existingReactions];
    const existingIndex = updatedReactions.findIndex(
      (reaction) =>
        reaction.emoji === emoji &&
        reaction.userId.toString() === currentUserId,
    );

    if (existingIndex >= 0) {
      updatedReactions.splice(existingIndex, 1);
    } else {
      updatedReactions.push({ emoji, userId: user._id as Types.ObjectId });
    }

    const updated = await this.postRepository.updateOne({
      filter: { _id: id },
      update: { reactions: updatedReactions },
    });

    if (!updated) {
      throw new NotFoundException("Failed to update reaction");
    }

    return updated as IPost;
  }

  async dashboard(
    user: HydratedDocument<IUser>,
  ): Promise<Record<string, number>> {
    const postCount = await this.postRepository.countDocuments({
      filter: { createdBy: user._id, deletedAt: null },
    });
    const commentCount = await this.commentRepository.countDocuments({
      filter: { createdBy: user._id, deletedAt: null },
    });
    const unreadNotifications =
      await this.notificationRepository.countDocuments({
        filter: { recipientId: user._id, isRead: false, deletedAt: null },
      });
    const activeStories = await this.storyRepository.countDocuments({
      filter: { createdBy: user._id, deletedAt: null },
    });

    return {
      postCount,
      commentCount,
      unreadNotifications,
      activeStories,
    };
  }
  reactPost = async (args: ReactOnPostArgsDto, user: IAuthUser["user"]) => {
    const updatedPost = await this.postRepository.updateOne({
      filter: { _id: args.postID },
      update: {
        $push: {
          reactions: {
            emoji: args.react,
            userId: user._id,
          },
          populate: this.populate,
        },
      },
    });

    if (!updatedPost) {
      throw new BadRequestException("Failed to react to post");
    }

    return updatedPost;
  };
}

export default new PostService();
