"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPasswordSchema = exports.forgotPasswordSchema = exports.signupSchema = exports.loginSchema = exports.confirmEmailSchema = exports.reSendConfirmEmailSchema = void 0;
const zod_1 = require("zod");
const validation_1 = require("../../common/validation");
exports.reSendConfirmEmailSchema = {
    body: zod_1.z.strictObject({
        email: validation_1.generalValidationFields.email,
    }),
};
exports.confirmEmailSchema = {
    body: exports.reSendConfirmEmailSchema.body.safeExtend({
        otp: validation_1.generalValidationFields.otp,
    }),
};
exports.loginSchema = {
    body: exports.reSendConfirmEmailSchema.body.safeExtend({
        password: validation_1.generalValidationFields.password,
        FCM: zod_1.z.string().optional()
    }),
};
exports.signupSchema = {
    body: exports.loginSchema.body.safeExtend({
        username: validation_1.generalValidationFields.username,
        confirmPassword: validation_1.generalValidationFields.confirmPassword,
        phone: validation_1.generalValidationFields.phone.optional(),
    }).refine((data) => {
        return data.password === data.confirmPassword;
    }, {
        error: "password mismatch with confirm password",
    }),
};
exports.forgotPasswordSchema = {
    body: zod_1.z.strictObject({
        email: validation_1.generalValidationFields.email,
    }),
};
exports.resetPasswordSchema = {
    body: exports.forgotPasswordSchema.body.safeExtend({
        otp: validation_1.generalValidationFields.otp,
        password: validation_1.generalValidationFields.password,
        confirmPassword: validation_1.generalValidationFields.confirmPassword,
    }).refine((data) => data.password === data.confirmPassword, {
        error: "password mismatch with confirm password",
    }),
};
