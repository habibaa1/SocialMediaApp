import { z } from "zod"
import { confirmEmailSchema, forgotPasswordSchema, loginSchema, reSendConfirmEmailSchema, resetPasswordSchema, signupSchema } from "./auth.validation";



export type LoginDto = z.infer<typeof loginSchema.body>
export type confirmEmailDto = z.infer<typeof confirmEmailSchema.body>
export type ResendConfirmEmailDto = z.infer<typeof reSendConfirmEmailSchema.body>
export type SignupDto = z.infer<typeof signupSchema.body>
export type forgotPasswordDto = z.infer<typeof forgotPasswordSchema.body>
export type resetPasswordDto = z.infer<typeof resetPasswordSchema.body>