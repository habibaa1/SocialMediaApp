"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatService = exports.ChatService = void 0;
const mongoose_1 = require("mongoose");
const repository_1 = require("../../DB/repository");
const exception_1 = require("../../common/exception");
const enums_1 = require("../../common/enums");
const services_1 = require("../../common/services");
const node_crypto_1 = require("node:crypto");
class ChatService {
    chatRepository;
    userRepository;
    s3Service;
    constructor() {
        this.chatRepository = new repository_1.chatRepository();
        this.userRepository = new repository_1.UserRepository();
        this.s3Service = new services_1.S3Service();
    }
    sayHi = () => {
        return "Done";
    };
    async getChat(participantId, { page, size }, user) {
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
            throw new exception_1.NotFoundExeption("Fail to find Matching Conversation");
        }
        return chat;
    }
    async sendMessage({ content, sendTo }, user) {
        let chat = await this.chatRepository.findOneAndUpdate({
            filter: {
                participants: { $all: [user._id, toObjectId(sendTo)] },
                type: enums_1.ChatEnum.ovo,
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
                    type: enums_1.ChatEnum.ovo,
                    createdBy: user._id,
                    createdAt: new Date(),
                },
            });
        }
        return chat;
    }
    async joinGroupRoom(roomId, user) {
        if (!roomId?.trim()) {
            throw new exception_1.BadRequestExaption("Missing roomId parameter");
        }
        const chat = await this.chatRepository.findOneChat({
            filter: {
                roomId,
                participants: user._id,
                type: enums_1.ChatEnum.ovm,
            },
            options: {
                populate: [{ path: "participants" }],
            },
            page: "1",
            size: "1",
        });
        if (!chat) {
            throw new exception_1.NotFoundExeption("Fail to find Matching Group Conversation");
        }
        return chat;
    }
    async sendGroupMessage({ roomId, content }, user) {
        if (!roomId?.trim()) {
            throw new exception_1.BadRequestExaption("Missing roomId parameter");
        }
        if (!content?.trim()) {
            throw new exception_1.BadRequestExaption("Message content is required");
        }
        const chat = await this.chatRepository.findOneAndUpdate({
            filter: {
                roomId,
                participants: user._id,
                type: enums_1.ChatEnum.ovm,
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
            throw new exception_1.NotFoundExeption("Fail to find Matching Group Conversation");
        }
        return chat;
    }
    async createGroup({ participantsIds = [], group, }, file, user) {
        const groupName = String(group ?? "").trim();
        if (!groupName || groupName.length < 3) {
            throw new exception_1.BadRequestExaption("Group name must be at least 3 characters long");
        }
        if (!Array.isArray(participantsIds) || participantsIds.length === 0) {
            throw new exception_1.BadRequestExaption("At least one participant ID is required");
        }
        const normalizedParticipantIds = participantsIds
            .map((participantId) => {
            if (typeof participantId === "string") {
                if (!mongoose_1.Types.ObjectId.isValid(participantId)) {
                    throw new exception_1.BadRequestExaption(`Invalid participant id: ${participantId}`);
                }
                return new mongoose_1.Types.ObjectId(participantId);
            }
            if (participantId?._bsontype === "ObjectID" ||
                mongoose_1.Types.ObjectId.isValid(participantId)) {
                return participantId;
            }
            throw new exception_1.BadRequestExaption(`Invalid participant id: ${String(participantId)}`);
        })
            .filter((participantId) => participantId.toString() !== user._id.toString());
        const uniqueParticipantIds = [
            ...new Set(normalizedParticipantIds.map((id) => id.toString())),
        ].map((id) => new mongoose_1.Types.ObjectId(id));
        if (uniqueParticipantIds.length === 0) {
            throw new exception_1.BadRequestExaption("Group must include at least one other participant");
        }
        const users = await this.userRepository.find({
            filter: {
                _id: { $in: uniqueParticipantIds },
                friends: user._id,
            },
        });
        if (users.length !== uniqueParticipantIds.length) {
            throw new exception_1.BadRequestExaption("Some participants were not found or are not friends with the user");
        }
        const roomId = (0, node_crypto_1.randomUUID)();
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
                type: enums_1.ChatEnum.ovm,
                group: groupName,
                group_image: groupImage,
                roomId,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        });
        return groupChat;
    }
    async getGroupChat(roomId, { page, size }, user) {
        if (!roomId) {
            throw new exception_1.BadRequestExaption("Missing roomId parameter");
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
            throw new exception_1.NotFoundExeption("Fail to find Matching Group Conversation");
        }
        return chat;
    }
}
exports.ChatService = ChatService;
exports.chatService = new ChatService();
function toObjectId(sendTo) {
    if (!sendTo)
        return sendTo;
    if (sendTo._bsontype === "ObjectID" ||
        mongoose_1.Types.ObjectId.isValid(sendTo)) {
        return typeof sendTo === "string" ? new mongoose_1.Types.ObjectId(sendTo) : sendTo;
    }
    return new mongoose_1.Types.ObjectId(sendTo);
}
