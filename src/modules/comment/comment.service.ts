import { HydratedDocument, Types } from "mongoose";
import { createCommentParamsDto, createCommentBodyDto, createReplyOnCommentParamsDto } from "./comment.dto";
import { IComment, IPost, IUser } from "../../common/interfaces";
import { NotificationService, notificationService, RedisService, redisService, S3Service } from "../../common/services";
import { CommentRepository, PostRepository, UserRepository } from "../../DB/repository";
import { BadRequestExaption, NotFoundExeption } from "../../common/exception/domain.exception";
import { getAvailability } from "../../common/utils/post";

import { toObjectId } from "../../common/utils/objectid";
export class CommentService {
private readonly redis: RedisService;
    private readonly userRepository: UserRepository;
    private readonly postRepository: PostRepository;
    private readonly notification: NotificationService;
    private readonly s3: S3Service;
    private readonly commentRepository: CommentRepository;

    constructor() {
        this.userRepository = new UserRepository();
        this.postRepository = new PostRepository();
        this.redis = redisService;
        this.notification = notificationService;
        this.s3 = new S3Service();
        this.commentRepository = new CommentRepository();
    }


async createComment(
        {postId}:createCommentParamsDto,{ content, files, tags }: createCommentBodyDto,
        user: HydratedDocument<IUser> 
    ) :Promise<IComment> {
        const post = await this.postRepository.findOne({
        filter: {
        _id: postId,
        $or: getAvailability(user)
    }
})
        if (!post) {
            throw new NotFoundExeption("Fail to find matching post")
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
        const folderId = post.folderId;
            let attachments: string[] = []
            if (files?.length) {
                attachments = await this.s3.uploadAssets({
                    files: files as Express.Multer.File[],
                    path: `Post/${folderId}`
                })
            }
            const comment = await this.commentRepository.createOne({
                data: {
                    createdBy: user._id,
                    content: content as string,
                    attachments,
                    postId: post._id,
                    tags: mentions
                }
            })
        if (!comment) {
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
                        message: `${user.username} mentioned you in his comment`,
                        postId: post._id,
                        commentId: comment._id
                    })
                }
            })
        }
        return comment.toJSON();
    }

async replyOnComment(
        {postId, commentId}:createReplyOnCommentParamsDto,{ content, files, tags }: createCommentBodyDto,
        user: HydratedDocument<IUser> 
    ) :Promise<IComment> {
        const comment = await this.commentRepository.findOne({
        filter: {
        _id: commentId,
        postId:postId,
    } ,
    options: {  
        populate: [{
            path: "postId",
            match: {
                $or: getAvailability(user)
            }
        }]
    }
})

    if (!comment || !comment.postId) {
    throw new NotFoundExeption("Fail to find matching comment");
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
        const post = comment.postId as HydratedDocument<IPost>;
        const folderId = post.folderId;
            let attachments: string[] = []
            if (files?.length) {
                attachments = await this.s3.uploadAssets({
                    files: files as Express.Multer.File[],
                    path: `Post/${folderId}`
                })
            }
            const reply = await this.commentRepository.createOne({
                data: {
                    createdBy: user._id,
                    content: content as string,
                    attachments,
                    postId: post._id,
                    commentId: comment._id,
                    tags: mentions
                }
            })
        if (!reply) {
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
                        message: `${user.username} mentioned you in his comment`,
                        postId: post._id,
                        commentId: comment._id,
                        replyId: reply._id
                    })
                }
            })
        }
        return reply.toJSON();
    }




}
export const commentService = new CommentService()