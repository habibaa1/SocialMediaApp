import { HydratedDocument, Types } from "mongoose";
import { chatRepository, UserRepository } from "../../DB/repository";
import { IChat, IUser } from "../../common/interfaces";
import {
  BadRequestExaption,
  NotFoundExeption,
} from "../../common/exception";
import { ChatEnum } from "../../common/enums";
import { S3Service } from "../../common/services";
import { randomUUID } from "node:crypto";

export class ChatService {
  private chatRepository: chatRepository;
  private userRepository: UserRepository;
  private s3Service: S3Service;
  constructor() {
    this.chatRepository = new chatRepository();
    this.userRepository = new UserRepository();
    this.s3Service = new S3Service();
  }

  sayHi = () => {
    return "Done";
  };

  async getChat(
    participantId: string,
    { page, size }: { page: string; size: string },
    user: HydratedDocument<IUser>,
  ): Promise<IChat> {
    const chat = await this.chatRepository.findOneChat({
      filter: {
        participants: { $all: [user._id, participantId] },
      },
      options: {
        populate: [{ path: "participants" }],
      },
      page,
      size,
    });
    if (!chat) {
      throw new NotFoundExeption("Fail to find Matching Conversation");
    }
    return chat;
  }

  async sendMessage(
    { content, sendTo }: { content: string; sendTo: string },
    user: HydratedDocument<IUser>,
  ): Promise<IChat> {
    let chat = await this.chatRepository.findOneAndUpdate({
      filter: {
        participants: { $all: [user._id, toObjectId(sendTo)] },
        type: ChatEnum.ovo,
      },
      update: {
        $addToSet: {
          messages: {
            content,
            createdBy: user._id,
            createdAt: new Date(),
          },
        },
      },
      options: {
        new: true,
      },
    });

    if (!chat) {
      chat = await this.chatRepository.createOne({
        data: {
          participants: [user._id, toObjectId(sendTo)],
          messages: [
            {
              content,
              createdBy: user._id,
              createdAt: new Date(),
            },
          ],
          type: ChatEnum.ovo,
          createdBy: user._id,
          createdAt: new Date(),
        },
      });
    }

    return chat;
  }

  async joinGroupRoom(
    roomId: string,
    user: HydratedDocument<IUser>,
  ): Promise<IChat> {
    if (!roomId?.trim()) {
      throw new BadRequestExaption("Missing roomId parameter");
    }

    const chat = await this.chatRepository.findOneChat({
      filter: {
        roomId,
        participants: user._id,
        type: ChatEnum.ovm,
      },
      options: {
        populate: [{ path: "participants" }],
      },
      page: "1",
      size: "1",
    });

    if (!chat) {
      throw new NotFoundExeption("Fail to find Matching Group Conversation");
    }

    return chat;
  }

  async sendGroupMessage(
    { roomId, content }: { roomId: string; content: string },
    user: HydratedDocument<IUser>,
  ): Promise<IChat> {
    if (!roomId?.trim()) {
      throw new BadRequestExaption("Missing roomId parameter");
    }

    if (!content?.trim()) {
      throw new BadRequestExaption("Message content is required");
    }

    const chat = await this.chatRepository.findOneAndUpdate({
      filter: {
        roomId,
        participants: user._id,
        type: ChatEnum.ovm,
      },
      update: {
        $push: {
          messages: {
            content,
            createdBy: user._id,
            createdAt: new Date(),
          },
        },
      },
      options: {
        new: true,
      },
    });

    if (!chat) {
      throw new NotFoundExeption("Fail to find Matching Group Conversation");
    }

    return chat;
  }

  async createGroup(
    {
      participantsIds = [],
      group,
    }: { participantsIds: string[] | Types.ObjectId[]; group: string },
    file: Express.Multer.File,
    user: HydratedDocument<IUser>,
  ): Promise<HydratedDocument<IChat>> {
    const groupName = String(group ?? "").trim();
    if (!groupName || groupName.length < 3) {
      throw new BadRequestExaption(
        "Group name must be at least 3 characters long",
      );
    }

    if (!Array.isArray(participantsIds) || participantsIds.length === 0) {
      throw new BadRequestExaption("At least one participant ID is required");
    }

    const normalizedParticipantIds = participantsIds
      .map((participantId) => {
        if (typeof participantId === "string") {
          if (!Types.ObjectId.isValid(participantId)) {
            throw new BadRequestExaption(
              `Invalid participant id: ${participantId}`,
            );
          }
          return new Types.ObjectId(participantId);
        }

        if (
          (participantId as any)?._bsontype === "ObjectID" ||
          Types.ObjectId.isValid(participantId)
        ) {
          return participantId as Types.ObjectId;
        }

        throw new BadRequestExaption(
          `Invalid participant id: ${String(participantId)}`,
        );
      })
      .filter(
        (participantId) => participantId.toString() !== user._id.toString(),
      );

    const uniqueParticipantIds = [
      ...new Set(normalizedParticipantIds.map((id) => id.toString())),
    ].map((id) => new Types.ObjectId(id));

    if (uniqueParticipantIds.length === 0) {
      throw new BadRequestExaption(
        "Group must include at least one other participant",
      );
    }

    const users = await this.userRepository.find({
      filter: {
        _id: { $in: uniqueParticipantIds },
        friends: user._id,
      },
    });

    if (users.length !== uniqueParticipantIds.length) {
      throw new BadRequestExaption(
        "Some participants were not found or are not friends with the user",
      );
    }

    const roomId = randomUUID();
    const path = `chat/group/${roomId}`;
    let groupImage = "";

    if (file) {
      groupImage = await this.s3Service.uploadFile(file, path, file.mimetype);
    }

    const groupChat = await this.chatRepository.createOne({
      data: {
        participants: [user._id, ...uniqueParticipantIds],
        createdBy: user._id,
        messages: [],
        type: ChatEnum.ovm,
        group: groupName,
        group_image: groupImage,
        roomId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return groupChat;
  }

  async getGroupChat(
    roomId: string,
    { page, size }: { page: string; size: string },
    user: HydratedDocument<IUser>,
  ): Promise<IChat> {
    if (!roomId) {
      throw new BadRequestExaption("Missing roomId parameter");
    }

    const chat = await this.chatRepository.findOneChat({
      filter: {
        roomId,
        participants: user._id,
      },
      options: {
        populate: [{ path: "participants" }],
      },
      page,
      size,
    });

    if (!chat) {
      throw new NotFoundExeption("Fail to find Matching Group Conversation");
    }

    return chat;
  }
}

export const chatService = new ChatService();

function toObjectId(sendTo: string | Types.ObjectId) {
  if (!sendTo) return sendTo as any;
  if (
    (sendTo as any)._bsontype === "ObjectID" ||
    Types.ObjectId.isValid(sendTo as any)
  ) {
    return typeof sendTo === "string" ? new Types.ObjectId(sendTo) : sendTo;
  }
  return new Types.ObjectId(sendTo as any);
}
