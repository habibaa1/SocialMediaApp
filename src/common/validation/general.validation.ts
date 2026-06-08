import { Types } from 'mongoose';
import { z } from 'zod';

export const generalValidationFields = {
    id: z.string().refine(value => { return Types.ObjectId.isValid(value) }, "Invalid ObjectId"),
    email: z.email({ error: "Invalid email address" }),

    password: z.string()
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*\W).{8,16}$/,
            {error: "Password is weak"}),

    phone: z.string({ error: "Phone is required" })
        .regex(/^(00201|\+201|01)(0|1|2|5)\d{8}$/, {
            error: "Invalid Egyptian phone number"
        }),

    otp: z.string({ error: "OTP is required" })
        .regex(/^\d{6}$/, {
            error: "OTP must be exactly 6 digits"
        }),

    username: z.string({ error: "UserName is required" })
        .min(2, { error: "min is 2" })
        .max(20, { error: "max is 20" }),

    confirmPassword: z.string({ error: "Confirm Password is required" }),
file: function (mimetype: string[]) {
    return z.strictObject({
        fieldname: z.string(),
        originalname: z.string(),
        encoding: z.string(),
        mimetype: z.enum(mimetype),
        buffer: z.any().optional(),
        path: z.string().optional(),
        size: z.number()

    }).superRefine((args, ctx) => {
        if (!args.path && !args.buffer) {
            ctx.addIssue({ 
                code: "custom", 
                message: "buffer is required", 
                path: ['buffer'] 
            }) 
        }
    })
}
}

export const paginationValidationSchema = {
    query:z.strictObject({
        page:z.coerce.number().optional(),
        size:z.coerce.number().optional(),
        search:z.string().optional(),
    })
}
export type PaginateDto = z.infer<typeof paginationValidationSchema.query>