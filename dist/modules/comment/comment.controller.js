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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const middleware_1 = require("../../middleware");
const response_1 = require("../../common/response");
const comment_service_1 = __importDefault(require("./comment.service"));
const validators = __importStar(require("./comment.validation"));
const router = (0, express_1.Router)();
router.post("/", (0, middleware_1.authentication)(), (0, middleware_1.validation)(validators.createCommentSchema), async (req, res, next) => {
    try {
        const data = await comment_service_1.default.createComment(req.body, req.user);
        return (0, response_1.successResponse)({
            res,
            status: 201,
            message: "Comment created successfully",
            data,
        });
    }
    catch (error) {
        return next(error);
    }
});
router.get("/post/:postId", (0, middleware_1.authentication)(), (0, middleware_1.validation)(validators.listPostCommentsSchema), async (req, res, next) => {
    try {
        const data = await comment_service_1.default.listPostComments(String(req.params.postId));
        return (0, response_1.successResponse)({ res, data });
    }
    catch (error) {
        return next(error);
    }
});
router.get("/:id", (0, middleware_1.authentication)(), (0, middleware_1.validation)(validators.getCommentSchema), async (req, res, next) => {
    try {
        const data = await comment_service_1.default.getCommentById(String(req.params.id));
        return (0, response_1.successResponse)({ res, data });
    }
    catch (error) {
        return next(error);
    }
});
router.patch("/:id", (0, middleware_1.authentication)(), (0, middleware_1.validation)(validators.updateCommentSchema), async (req, res, next) => {
    try {
        const data = await comment_service_1.default.updateComment(String(req.params.id), req.body, req.user);
        return (0, response_1.successResponse)({
            res,
            message: "Comment updated successfully",
            data,
        });
    }
    catch (error) {
        return next(error);
    }
});
router.delete("/:id", (0, middleware_1.authentication)(), (0, middleware_1.validation)(validators.deleteCommentSchema), async (req, res, next) => {
    try {
        await comment_service_1.default.deleteComment(String(req.params.id), req.user);
        return (0, response_1.successResponse)({
            res,
            message: "Comment deleted successfully",
        });
    }
    catch (error) {
        return next(error);
    }
});
router.post("/:id/react", (0, middleware_1.authentication)(), (0, middleware_1.validation)(validators.reactCommentSchema), async (req, res, next) => {
    try {
        const data = await comment_service_1.default.reaction(String(req.params.id), req.body, req.user);
        return (0, response_1.successResponse)({
            res,
            message: "Comment reaction updated",
            data,
        });
    }
    catch (error) {
        return next(error);
    }
});
router.post("/:id/reply", (0, middleware_1.authentication)(), (0, middleware_1.validation)(validators.replyCommentSchema), async (req, res, next) => {
    try {
        const data = await comment_service_1.default.replyToComment(String(req.params.id), req.body, req.user);
        return (0, response_1.successResponse)({
            res,
            status: 201,
            message: "Reply created successfully",
            data,
        });
    }
    catch (error) {
        return next(error);
    }
});
exports.default = router;
