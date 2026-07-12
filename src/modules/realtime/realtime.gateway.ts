import { Server as httpServerType } from "node:http";
import { Server } from "socket.io";
import { IAuthSocket } from "../../common/types/express.types";
import { redisService, TokenService } from "../../common/services";
import { tokenTypeEnum } from "../../common/Enums";
import { chatGateway } from "../chat";

export class RealtimeGateway {
  private io!: Server;
  private tokenService: TokenService;
  private redisService: typeof redisService;


constructor() {
  this.tokenService = new TokenService();
  this.redisService = redisService;
}

  authentication = async (socket: IAuthSocket, next: any) => {
    try {
      const token =
        socket.handshake.auth.authorization ||
        socket.handshake.headers.authorization;
      const { user, decode: decoded } = await this.tokenService.decodeToken({
        token,
        tokenType: tokenTypeEnum.ACCESS,
      });
      socket.data = { user, decoded };
      await this.redisService.addSocket(user.id, socket.id);
      next();
    } catch (error) {
      next(error);
    }
  };

  initializeIo = (HttpServer: httpServerType) => {
    this.io = new Server(HttpServer, {
      cors: { origin: "*" },
    });

    this.io.use(this.authentication);

    this.io.on("connection", async (socket: IAuthSocket) => {
   

      chatGateway.registerEvents(socket , this.io);



      socket.on("disconnect", async () => {
        const userId = socket.data.user._id.toString();
        await this.redisService.removeSocket(userId, socket.id);
        const connections =
          (await this.redisService.getSockets(userId)) || [];
        if (connections.length < 1) {
          this.io.emit("offline_user", { userId: socket.data.user._id });
        }
      });



    });
  };
}


export const realtimeGateway = new RealtimeGateway();