"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bootstrap = void 0;
const express_1 = __importDefault(require("express"));
const modules_1 = require("./modules");
const middleware_1 = require("./modules/middleware");
const connections_db_1 = require("./DB/connections.db");
const config_1 = require("./config/config");
const services_1 = require("./common/services");
const cors_1 = __importDefault(require("cors"));
const user_reposatory_1 = require("./DB/repository/user.reposatory");
const mongoose_1 = require("mongoose");
const response_1 = require("./common/response");
const node_stream_1 = require("node:stream");
const node_util_1 = require("node:util");
const express_2 = require("graphql-http/lib/use/express");
const bootstrap = async () => {
    const s3WriteStream = (0, node_util_1.promisify)(node_stream_1.pipeline);
    const app = (0, express_1.default)();
    app.use(express_1.default.json());
    app.use((0, cors_1.default)());
    app.get("/", (req, res, next) => {
        return res.status(200).json({ message: "landing page" });
    });
    app.use("/auth", modules_1.authRouter);
    app.use("/user", modules_1.userRouter);
    app.use("/post", modules_1.PostRouter);
    app.all('/graphql', (0, express_2.createHandler)({ schema: modules_1.schema }));
    app.get("/uploads/*path", async (req, res, next) => {
        const { download, fileName } = req.query;
        const { path } = req.params;
        const Key = path.join("/");
        const { Body, ContentType } = await services_1.s3Service.getAsset({ Key });
        console.log({ Body, ContentType });
        res.setHeader("Content-Type", ContentType || "application/octet-stream");
        res.set("Cross-Origin-Resource-Policy", "cross-origin");
        if (download === "true") {
            res.setHeader("Content-Disposition", `attachment; filename="${fileName || Key.split("/").pop()}"`);
        }
        return await s3WriteStream(Body, res);
    });
    app.get("/pre-signed/*path", async (req, res, next) => {
        const { download, fileName } = req.query;
        const { path } = req.params;
        const Key = path.join("/");
        const url = await services_1.s3Service.CreatePreSignedFetchLink({ Key, download, fileName });
        return (0, response_1.successResponse)({ res, data: { url } });
    });
    app.use(middleware_1.globalErroHandler);
    app.get("/*dummy", (req, res, next) => {
        res.status(404).json({ message: "invalid route" });
    });
    await (0, connections_db_1.connectDB)();
    await services_1.redisService.connect();
    try {
        const userRepository = new user_reposatory_1.UserRepository();
        const user = await userRepository.deleteOne({
            filter: {
                _id: mongoose_1.Types.ObjectId.createFromHexString('69fe27744b49da3e63c0c967'),
                force: true
            },
        });
    }
    catch (error) {
        console.log(error);
    }
    app.listen(config_1.PORT, () => {
        console.log(`Server is running on port ${config_1.PORT}👌`);
    });
};
exports.bootstrap = bootstrap;
exports.default = exports.bootstrap;
