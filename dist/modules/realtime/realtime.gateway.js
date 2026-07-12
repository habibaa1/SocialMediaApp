"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.realtimeGateway = exports.RealtimeGateway = void 0;
const socket_io_1 = require("socket.io");
const services_1 = require("../../common/services");
const Enums_1 = require("../../common/Enums");
const chat_1 = require("../chat");
class RealtimeGateway {
    io;
    tokenService;
    redisService;
    constructor() {
        this.tokenService = new services_1.TokenService();
        this.redisService = services_1.redisService;
    }
    authentication = async (socket, next) => {
        try {
            const token = socket.handshake.auth.authorization ||
                socket.handshake.headers.authorization;
            const { user, decode: decoded } = await this.tokenService.decodeToken({
                token,
                tokenType: Enums_1.tokenTypeEnum.ACCESS,
            });
            socket.data = { user, decoded };
            await this.redisService.addSocket(user.id, socket.id);
            next();
        }
        catch (error) {
            next(error);
        }
    };
    initializeIo = (HttpServer) => {
        this.io = new socket_io_1.Server(HttpServer, {
            cors: { origin: "*" },
        });
        this.io.use(this.authentication);
        this.io.on("connection", async (socket) => {
            chat_1.chatGateway.registerEvents(socket, this.io);
            socket.on("disconnect", async () => {
                const userId = socket.data.user._id.toString();
                await this.redisService.removeSocket(userId, socket.id);
                const connections = (await this.redisService.getSockets(userId)) || [];
                if (connections.length < 1) {
                    this.io.emit("offline_user", { userId: socket.data.user._id });
                }
            });
        });
    };
}
exports.RealtimeGateway = RealtimeGateway;
exports.realtimeGateway = new RealtimeGateway();
