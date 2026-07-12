"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const response_1 = require("../../common/response");
const user_service_1 = __importDefault(require("./user.service"));
const middleware_1 = require("../../middleware");
const user_authorization_1 = require("./user.authorization");
const enums_1 = require("../../common/enums");
const multer_1 = require("../../common/utils/multer");
const chat_1 = require("../chat");
const router = (0, express_1.Router)();
router.use("/:userId/chat", chat_1.chatRouter);
router.get("/profile", (0, middleware_1.authentication)(), (0, middleware_1.authorization)(user_authorization_1.endpoint.profile), async (req, res, next) => {
    const data = await user_service_1.default.profile(req.user._id.toString());
    return (0, response_1.successResponse)({ res, data });
});
router.post("/logout", (0, middleware_1.authentication)(), async (req, res, next) => {
    const status = await user_service_1.default.logout(req.body, req.user, req.decoded);
    return (0, response_1.successResponse)({ res, status });
});
router.post("/rotate-token", (0, middleware_1.authentication)(enums_1.TokenTypeEnum.REFRESH), async (req, res, next) => {
    const credential = await user_service_1.default.rotateToken(req.user, req.decoded, `${req.protocol}://${req.host}`);
    return (0, response_1.successResponse)({ res, status: 201, data: { ...credential } });
});
router.patch("/profile-image", (0, middleware_1.authentication)(), async (req, res, next) => {
    const { ContentType, originalname } = req.body;
    const { user, url } = await user_service_1.default.profileImage({ ContentType, originalname }, req.user);
    return (0, response_1.successResponse)({
        res,
        data: { user, uploadUrl: url },
        message: "Pre-signed URL generated. Upload the file directly to uploadUrl using HTTP PUT.",
    });
});
router.patch("/profile-cover-image", (0, middleware_1.authentication)(), (0, multer_1.cloudFileUpload)({
    validation: multer_1.fileValidation.image,
    storageApproach: enums_1.StorageApproachEnum.DISK,
}).array("attachments", 10), async (req, res, next) => {
    const files = req.files;
    const user = await user_service_1.default.profileCoverImages(files, req.user);
    return (0, response_1.successResponse)({
        res,
        data: user,
        message: `${files.length} cover image(s) uploaded successfully`,
    });
});
router.post("/create-presigned-upload-link", (0, middleware_1.authentication)(), async (req, res, next) => {
    const { uploadUrl, fileKey } = await user_service_1.default.createPresignedUploadLink(req.body, req.user);
    return (0, response_1.successResponse)({
        res,
        data: { uploadUrl, fileKey },
        message: "Pre-signed URL generated. Upload the file directly to uploadUrl using HTTP PUT.",
    });
});
router.get("/file", (0, middleware_1.authentication)(), async (req, res, next) => {
    const { stream, ContentType } = await user_service_1.default.streamFile(req.query.key);
    res.setHeader("Content-Type", ContentType || "application/octet-stream");
    res.set("Cross-Origin-Resource-Policy", "cross-origin");
    await user_service_1.default.pipeFileTo(stream, res);
    return;
});
router.get("/file/download", (0, middleware_1.authentication)(), async (req, res, next) => {
    const downloadUrl = await user_service_1.default.getDownloadUrl(req.query.key, typeof req.query.name === "string" ? req.query.name : undefined);
    return (0, response_1.successResponse)({
        res,
        data: { downloadUrl },
        message: "Pre-signed download URL valid for 60 seconds.",
    });
});
router.delete("/delete", (0, middleware_1.authentication)(), async (req, res, next) => {
    await user_service_1.default.softDelete(req.user, req.decoded);
    return (0, response_1.successResponse)({
        res,
        message: "Account deleted successfully",
    });
});
exports.default = router;
