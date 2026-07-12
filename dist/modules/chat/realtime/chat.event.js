"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatEvent = exports.ChatEvent = void 0;
const middleware_1 = require("../../../middleware");
const chat_service_1 = require("../chat.service");
const validators = __importStar(require("../chat.validation"));
const services_1 = require("../../../common/services");
class ChatEvent {
    redisService;
    chatService;
    constructor() {
        this.chatService = new chat_service_1.ChatService();
        this.redisService = new services_1.RedisService();
    }
    sayHi = (socket) => {
        return socket.on("sayHi", async (data) => {
            try {
                await (0, middleware_1.socketValidation)(validators.sayHi, data);
                console.log({ data });
                const result = this.chatService.sayHi();
                socket.emit("sayHiBack", { message: result, timestamp: new Date() });
            }
            catch (error) {
                socket.emit("An error occurred", error);
            }
        });
    };
    sendMessage = (socket, io) => {
        return socket.on("sendMessage", async ({ content, sendTo }) => {
            try {
                console.log({ content, sendTo });
                await this.chatService.sendMessage({ content, sendTo }, socket.data.user);
                io.to(await this.redisService.getSockets(socket.data.user._id.toString())).emit("successMessage", {
                    content,
                    from: socket.data.user._id.toString(),
                });
                const receiversSocketIds = await this.redisService.getSockets(sendTo);
                if (receiversSocketIds.length > 0) {
                    socket
                        .to(receiversSocketIds)
                        .emit("newMessage", { content, sendTo });
                }
            }
            catch (error) {
                console.log({ error });
                socket.emit("custom_error", error);
            }
        });
    };
    joinGroupRoom = (socket) => {
        return socket.on("joinGroupRoom", async ({ roomId }) => {
            try {
                await (0, middleware_1.socketValidation)(validators.joinGroupRoom, {
                    roomId,
                });
                await this.chatService.joinGroupRoom(roomId, socket.data.user);
                const roomName = `group:${roomId}`;
                socket.join(roomName);
                socket.emit("joinedGroupRoom", { roomId });
            }
            catch (error) {
                console.log({ error });
                socket.emit("custom_error", error);
            }
        });
    };
    sendGroupMessage = (socket, io) => {
        return socket.on("sendGroupMessage", async ({ roomId, content }) => {
            try {
                await (0, middleware_1.socketValidation)(validators.sendGroupMessage, { roomId, content });
                await this.chatService.sendGroupMessage({ roomId, content }, socket.data.user);
                const roomName = `group:${roomId}`;
                io.to(roomName).emit("newGroupMessage", {
                    roomId,
                    content,
                    from: socket.data.user._id.toString(),
                });
            }
            catch (error) {
                console.log({ error });
                socket.emit("custom_error", error);
            }
        });
    };
}
exports.ChatEvent = ChatEvent;
exports.chatEvent = new ChatEvent();
