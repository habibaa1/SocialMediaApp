import { Server } from "socket.io";
import { IAuthSocket } from "../../../common/types/express.types";
import { socketValidation } from "../../../middleware";
import { ChatService } from "../chat.service";
import * as validators from "../chat.validation";
import { RedisService } from "../../../common/services";

export class ChatEvent {
  private redisService: RedisService;
  private chatService: ChatService;
  constructor() {
    this.chatService = new ChatService();
    this.redisService = new RedisService();
  }

  sayHi = (socket: IAuthSocket) => {
    return socket.on("sayHi", async (data: { name: string }) => {
      try {
        await socketValidation<{ name: string }>(validators.sayHi, data);
        console.log({ data });
        const result = this.chatService.sayHi();
        socket.emit("sayHiBack", { message: result, timestamp: new Date() });
      } catch (error) {
        socket.emit("An error occurred", error);
      }
    });
  };

  sendMessage = (socket: IAuthSocket, io: Server) => {
    return socket.on(
      "sendMessage",
      async ({ content, sendTo }: { sendTo: string; content: string }) => {
        try {
          console.log({ content, sendTo });
          await this.chatService.sendMessage(
            { content, sendTo },
            socket.data.user,
          );
          io.to(
            await this.redisService.getSockets(socket.data.user._id.toString()),
          ).emit("successMessage", {
            content,
            from: socket.data.user._id.toString(),
          });

          const receiversSocketIds = await this.redisService.getSockets(sendTo);
          if (receiversSocketIds.length > 0) {
            socket
              .to(receiversSocketIds)
              .emit("newMessage", { content, sendTo });
          }
        } catch (error) {
          console.log({ error });
          socket.emit("custom_error", error);
        }
      },
    );
  };

  joinGroupRoom = (socket: IAuthSocket) => {
    return socket.on(
      "joinGroupRoom",
      async ({ roomId }: { roomId: string }) => {
        try {
          await socketValidation<{ roomId: string }>(validators.joinGroupRoom, {
            roomId,
          });

          await this.chatService.joinGroupRoom(roomId, socket.data.user);
          const roomName = `group:${roomId}`;
          socket.join(roomName);

          socket.emit("joinedGroupRoom", { roomId });
        } catch (error) {
          console.log({ error });
          socket.emit("custom_error", error);
        }
      },
    );
  };

  sendGroupMessage = (socket: IAuthSocket, io: Server) => {
    return socket.on(
      "sendGroupMessage",
      async ({ roomId, content }: { roomId: string; content: string }) => {
        try {
          await socketValidation<{ roomId: string; content: string }>(
            validators.sendGroupMessage,
            { roomId, content },
          );

          await this.chatService.sendGroupMessage(
            { roomId, content },
            socket.data.user,
          );

          const roomName = `group:${roomId}`;
          io.to(roomName).emit("newGroupMessage", {
            roomId,
            content,
            from: socket.data.user._id.toString(),
          });
        } catch (error) {
          console.log({ error });
          socket.emit("custom_error", error);
        }
      },
    );
  };
}

export const chatEvent = new ChatEvent();
