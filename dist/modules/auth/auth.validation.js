"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetForgotPassword = exports.signup = exports.login = exports.ConfirmEmail = exports.resendConfirmEmail = void 0;
const zod_1 = require("zod");
const validation_1 = require("../../common/validation");
exports.resendConfirmEmail = {
    body: zod_1.z.strictObject({
        email: validation_1.generalValidationFields.email,
    })
};
exports.ConfirmEmail = {
    body: exports.resendConfirmEmail.body.safeExtend({
        otp: validation_1.generalValidationFields.otp,
    })
};
exports.login = {
    body: exports.resendConfirmEmail.body.safeExtend({
        password: validation_1.generalValidationFields.password,
        FCM: zod_1.z.string().optional()
    })
};
exports.signup = {
    body: exports.login.body.safeExtend({
        username: validation_1.generalValidationFields.username,
        phone: validation_1.generalValidationFields.phone.optional(),
        confirmPassword: validation_1.generalValidationFields.confirmPassword
    }).refine((data) => {
        return data.password === data.confirmPassword;
    }, { message: "password and confirm password must be the same", })
};
exports.resetForgotPassword = {
    body: zod_1.z.strictObject({
        email: validation_1.generalValidationFields.email,
        otp: validation_1.generalValidationFields.otp,
        password: validation_1.generalValidationFields.password,
        confirmPassword: validation_1.generalValidationFields.confirmPassword
    }).refine((data) => {
        return data.password === data.confirmPassword;
    }, {
        message: "password and confirm password must be the same",
        path: ["confirmPassword"]
    })
};
