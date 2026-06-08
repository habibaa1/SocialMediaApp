"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paginationValidationSchema = exports.generalValidationFields = void 0;
const mongoose_1 = require("mongoose");
const zod_1 = require("zod");
exports.generalValidationFields = {
    id: zod_1.z.string().refine(value => { return mongoose_1.Types.ObjectId.isValid(value); }, "Invalid ObjectId"),
    email: zod_1.z.email({ error: "Invalid email address" }),
    password: zod_1.z.string()
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*\W).{8,16}$/, { error: "Password is weak" }),
    phone: zod_1.z.string({ error: "Phone is required" })
        .regex(/^(00201|\+201|01)(0|1|2|5)\d{8}$/, {
        error: "Invalid Egyptian phone number"
    }),
    otp: zod_1.z.string({ error: "OTP is required" })
        .regex(/^\d{6}$/, {
        error: "OTP must be exactly 6 digits"
    }),
    username: zod_1.z.string({ error: "UserName is required" })
        .min(2, { error: "min is 2" })
        .max(20, { error: "max is 20" }),
    confirmPassword: zod_1.z.string({ error: "Confirm Password is required" }),
    file: function (mimetype) {
        return zod_1.z.strictObject({
            fieldname: zod_1.z.string(),
            originalname: zod_1.z.string(),
            encoding: zod_1.z.string(),
            mimetype: zod_1.z.enum(mimetype),
            buffer: zod_1.z.any().optional(),
            path: zod_1.z.string().optional(),
            size: zod_1.z.number()
        }).superRefine((args, ctx) => {
            if (!args.path && !args.buffer) {
                ctx.addIssue({
                    code: "custom",
                    message: "buffer is required",
                    path: ['buffer']
                });
            }
        });
    }
};
exports.paginationValidationSchema = {
    query: zod_1.z.strictObject({
        page: zod_1.z.coerce.number().optional(),
        size: zod_1.z.coerce.number().optional(),
        search: zod_1.z.string().optional(),
    })
};
