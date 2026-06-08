import { HydratedDocument, Types } from "mongoose";
import { createPostBodyDto ,reactPostParamsDto , reactPostQueryDto , UpdatePostBodyDto, UpdatePostParamsDto} from "./post.dto";
import { IPaginate, IPost, IUser } from "../../common/interfaces";
import { NotificationService, notificationService, RedisService, redisService, S3Service } from "../../common/services";
import { PostRepository, UserRepository } from "../../DB/repository";
import { BadRequestExaption, NotFoundExeption } from "../../common/exception/domain.exception";
import { randomUUID } from "crypto";
import { getAvailability } from "../../common/utils/post";
import { PaginateDto } from "../../common/validation/general.validation";
import { toObjectId } from "../../common/utils/objectid";
export class PostService {
private readonly redis: RedisService;
    private readonly userRepository: UserRepository;
    private readonly postRepository: PostRepository;
    private readonly notification: NotificationService;
    private readonly s3: S3Service;

    constructor() {
        this.userRepository = new UserRepository();
        this.postRepository = new PostRepository();
        this.redis = redisService;
        this.notification = notificationService;
        this.s3 = new S3Service();
    }
async postList({page, size, search}: PaginateDto, user: HydratedDocument<IUser> ) :Promise<IPaginate<IPost>> {
    const posts = await this.postRepository.paginate({
        filter: {
            $or: getAvailability(user),
            ...(search?.length ? { content: { $regex: search, $options: "i" } } : {})
        },
        page,size,
        options: {
            populate: [{path:"comments", populate:[{path:"reply", populate:[{path:"reply"}]}]}]
        }
    });

        return posts;
    }

async createPost(
        { availability, content, files, tags }: createPostBodyDto,
        user: HydratedDocument<IUser> 
    ) :Promise<IPost> {
        const mentions: Types.ObjectId[] = [];
        const FCM_Tokens: string[] = [];

        if (tags?.length) {
            const mentionedAccounts = await this.userRepository.find({
                filter: {
                    _id: { $in: tags }
                }
            });

            if (mentionedAccounts.length !== tags.length) {
                throw new NotFoundExeption("Fail to find some or all mentioned accounts");
            }

            for (const tag of tags) {
                mentions.push(toObjectId(tag));
                
                (await this.redis.getFCMs(tag) || []).map(token => FCM_Tokens.push(token));
            }
        }
        const folderId = randomUUID();
            let attachments: string[] = []
            if (files?.length) {
                attachments = await this.s3.uploadAssets({
                    files: files as Express.Multer.File[],
                    path: `Post/${folderId}`
                })
            }
            const post = await this.postRepository.createOne({
                data: {
                    createdBy: user._id,
                    content: content as string,
                    attachments,
                    folderId,
                    availability,
                    tags: mentions
                }
            })
        if (!post) {
            if (attachments.length) {
                await this.s3.deleteAssets({
                    Keys: attachments.map(ele =>{ 
                        return{Key:ele}
                    })
                });
            }
    throw new BadRequestExaption("Fail")
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
            })
        }
        return post.toJSON();
    }

async updatePost(
        { postId }: UpdatePostParamsDto,
        { availability, content, files=[], tags=[], removeFiles=[], removeTags=[] }: UpdatePostBodyDto,
        user: HydratedDocument<IUser> 
    ) :Promise<IPost> {
        const post = await this.postRepository.findOne({
    filter: { _id: postId, createdBy: user._id }
})

if (!post) {
    throw new NotFoundExeption("Fail to find matching post")
}

    if (!post.content && !content && !files?.length && post.attachments?.length == removeFiles.length) {
    throw new BadRequestExaption("We cannot leave empty post")
}
        const mentions: Types.ObjectId[] = [];
        const FCM_Tokens: string[] = [];

        if (tags?.length) {
            const mentionedAccounts = await this.userRepository.find({
                filter: {
                    _id: { $in: tags }
                }
            });

            if (mentionedAccounts.length !== tags.length) {
                throw new NotFoundExeption("Fail to find some or all mentioned accounts");
            }

            for (const tag of tags) {
                mentions.push(toObjectId(tag));
                
                (await this.redis.getFCMs(tag) || []).map(token => FCM_Tokens.push(token));
            }
        }
        const folderId = randomUUID();
            let attachments: string[] = []
            if (files?.length) {
                attachments = await this.s3.uploadAssets({
                    files: files as Express.Multer.File[],
                    path: `Post/${folderId}`
                })
            }
            const updatedPost = await this.postRepository.findOneAndUpdate({
                filter: { 
                _id: postId, 
                createdBy: user._id },
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
                                            removeTags.map(ele => {return toObjectId(ele)})
                                        ]
                                    },
                                    mentions
                                ]
                            }
                        }
                    }
                ]
            })
        if (!updatedPost) {
            if (attachments.length) {
                await this.s3.deleteAssets({
                    Keys: attachments.map(ele =>{ 
                        return{Key:ele}
                    })
                });
            }
    throw new BadRequestExaption("Fail")
}
if (removeFiles.length) {
    await this.s3.deleteAssets({
        Keys: removeFiles.map(ele =>{
            return{Key:ele}
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
            })
        }
        return updatedPost.toJSON();
    }
async reactPost({ postId }: reactPostParamsDto, { react }: reactPostQueryDto, user: HydratedDocument<IUser>): Promise<IPost> {

    const post = await this.postRepository.findOneAndUpdate({
        filter: {
            _id: postId,
            $or: getAvailability(user),
        },
        update: {
            ...(Number(react) > 0 ? { $addToSet: { likes: user._id } } : { $pull: { likes: user._id } })
        }
    })

    if (!post) {
        throw new NotFoundExeption("Fail to find matching post")
    }
    return post.toJSON()

}





}
export const postService = new PostService()