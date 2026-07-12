"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const middleware_1 = require("../../middleware");
const middleware_2 = require("../../middleware");
const response_1 = require("../../common/response");
const chat_service_1 = require("./chat.service");
const multer_1 = require("../../common/utils/multer");
const validation_multer_1 = require("../../common/utils/multer/validation.multer");
const chat_validation_1 = require("./chat.validation");
const router = (0, express_1.Router)({ mergeParams: true });
router.get("/", (0, middleware_1.authentication)(), async (req, res, next) => {
    try {
        const query = {
            page: String(req.query.page ?? "1"),
            size: String(req.query.size ?? "10"),
        };
        const chat = await chat_service_1.chatService.getChat(req.params.userId, query, req.user);
        return (0, response_1.successResponse)({ res, data: { chat } });
    }
    catch (error) {
        return next(error);
    }
});
router.get("/group/:roomId", (0, middleware_1.authentication)(), async (req, res, next) => {
    try {
        const query = {
            page: String(req.query.page ?? "1"),
            size: String(req.query.size ?? "10"),
        };
        const chat = await chat_service_1.chatService.getGroupChat(req.params.roomId, query, req.user);
        return (0, response_1.successResponse)({ res, data: { chat } });
    }
    catch (error) {
        return next(error);
    }
});
router.post("/group", (0, middleware_1.authentication)(), (0, multer_1.cloudFileUpload)({ validation: validation_multer_1.fileFieldValidation.image }).single("attachment"), (0, middleware_2.validation)(chat_validation_1.createGroup), async (req, res, next) => {
    try {
        const chat = await chat_service_1.chatService.createGroup(req.body, req.file, req.user);
        return (0, response_1.successResponse)({ res, data: { chat } });
    }
    catch (error) {
        return next(error);
    }
});
exports.default = router;
