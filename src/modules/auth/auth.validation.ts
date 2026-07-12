import { z } from "zod";
import { generalValidation } from "../../common/validation";

export const reSendConfirmEmailSchema = {
  body: z.strictObject({
    email: generalValidation.email,
  }),
};
  
export const confirmEmailSchema = {
  body: reSendConfirmEmailSchema.body.safeExtend({
      otp: generalValidation.otp,
    }),
};

export const loginSchema = {
  body: reSendConfirmEmailSchema.body.safeExtend({
    password: generalValidation.password,
    FCM: z.string().optional()
  }),
};

export const signupSchema = {
  body: loginSchema.body.safeExtend({
      username: generalValidation.username,
      confirmPassword: generalValidation.confirmPassword,
      phone: generalValidation.phone.optional(),
    }).refine(
      (data) => {
        return data.password === data.confirmPassword;
      },
      {
        error: "password mismatch with confirm password",
      },
    ),
};

export const forgotPasswordSchema = {
  body: z.strictObject({
    email: generalValidation.email,
  }),
};

export const resetPasswordSchema = {
  body: forgotPasswordSchema.body.safeExtend({
    otp: generalValidation.otp,
    password: generalValidation.password,
    confirmPassword: generalValidation.confirmPassword,
  }).refine(
    (data) => data.password === data.confirmPassword,
    {
      error: "password mismatch with confirm password",
    },
  ),
};