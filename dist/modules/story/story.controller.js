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
const story_service_1 = __importDefault(require("./story.service"));
const validators = __importStar(require("./story.validation"));
const router = (0, express_1.Router)();
router.post("/", (0, middleware_1.authentication)(), (0, middleware_1.validation)(validators.createStorySchema), async (req, res, next) => {
    try {
        const data = await story_service_1.default.createStory(req.body, req.user);
        return (0, response_1.successResponse)({
            res,
            status: 201,
            message: "Story created successfully",
            data,
        });
    }
    catch (error) {
        return next(error);
    }
});
router.get("/", (0, middleware_1.authentication)(), async (req, res, next) => {
    try {
        const data = await story_service_1.default.listFeedStories();
        return (0, response_1.successResponse)({ res, data });
    }
    catch (error) {
        return next(error);
    }
});
router.get("/mine", (0, middleware_1.authentication)(), async (req, res, next) => {
    try {
        const data = await story_service_1.default.listOwnStories(req.user);
        return (0, response_1.successResponse)({ res, data });
    }
    catch (error) {
        return next(error);
    }
});
router.get("/:id", (0, middleware_1.authentication)(), (0, middleware_1.validation)(validators.getStorySchema), async (req, res, next) => {
    try {
        const data = await story_service_1.default.getStoryById(String(req.params.id));
        return (0, response_1.successResponse)({ res, data });
    }
    catch (error) {
        return next(error);
    }
});
router.delete("/:id", (0, middleware_1.authentication)(), (0, middleware_1.validation)(validators.deleteStorySchema), async (req, res, next) => {
    try {
        await story_service_1.default.deleteStory(String(req.params.id), req.user);
        return (0, response_1.successResponse)({
            res,
            message: "Story deleted successfully",
        });
    }
    catch (error) {
        return next(error);
    }
});
exports.default = router;
