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
const auth_service_1 = __importDefault(require("./auth.service"));
const response_1 = require("../../common/response");
const validators = __importStar(require("./auth.validation"));
const middleware_1 = require("../../middleware");
const router = (0, express_1.Router)();
router.post("/login", (0, middleware_1.validation)(validators.loginSchema), async (req, res, next) => {
    try {
        const data = await auth_service_1.default.login(req.body, `${req.protocol}://${req.get("host")}`);
        (0, response_1.successResponse)({
            res,
            data,
        });
    }
    catch (error) {
        next(error);
    }
});
router.post("/signup", (0, middleware_1.validation)(validators.signupSchema), async (req, res, next) => {
    try {
        const result = await auth_service_1.default.signup(req.body);
        (0, response_1.successResponse)({
            res,
            status: 201,
            message: "Signup successful",
            data: result,
        });
    }
    catch (error) {
        next(error);
    }
});
router.patch("/confirm-email", (0, middleware_1.validation)(validators.confirmEmailSchema), async (req, res, next) => {
    try {
        const account = await auth_service_1.default.confirmEmail(req.body);
        (0, response_1.successResponse)({
            res,
            data: account,
        });
    }
    catch (error) {
        next(error);
    }
});
router.patch("/resend-confirm-email", (0, middleware_1.validation)(validators.reSendConfirmEmailSchema), async (req, res, next) => {
    try {
        const account = await auth_service_1.default.reSendConfirmEmail(req.body);
        (0, response_1.successResponse)({
            res,
            data: account,
        });
    }
    catch (error) {
        next(error);
    }
});
router.post("/forgot-password", (0, middleware_1.validation)(validators.forgotPasswordSchema), async (req, res, next) => {
    try {
        const data = await auth_service_1.default.forgotPassword(req.body);
        (0, response_1.successResponse)({
            res,
            data,
        });
    }
    catch (error) {
        next(error);
    }
});
router.patch("/reset-password", (0, middleware_1.validation)(validators.resetPasswordSchema), async (req, res, next) => {
    try {
        const data = await auth_service_1.default.resetPassword(req.body);
        (0, response_1.successResponse)({
            res,
            data,
        });
    }
    catch (error) {
        next(error);
    }
});
router.post("/signup/gmail", async (req, res, next) => {
    try {
        const result = await auth_service_1.default.signupWithGmail(req.body, `${req.protocol}://${req.get("host")}`);
        (0, response_1.successResponse)({
            res,
            status: 201,
            message: "Gmail signup successful",
            data: result,
        });
    }
    catch (error) {
        next(error);
    }
});
router.post("/login/gmail", async (req, res, next) => {
    try {
        const result = await auth_service_1.default.loginWithGmail(req.body, `${req.protocol}://${req.get("host")}`);
        (0, response_1.successResponse)({
            res,
            message: "Gmail login successful",
            data: result,
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
