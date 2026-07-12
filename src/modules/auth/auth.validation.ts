import { z } from "zod";
import { generalValidationFields } from "../../common/validation";

export const reSendConfirmEmailSchema = {
  body: z.strictObject({
    email: generalValidationFields.email,
  }),
};
  
export const confirmEmailSchema = {
  body: reSendConfirmEmailSchema.body.safeExtend({
      otp: generalValidationFields.otp,
    }),
};

export const loginSchema = {
  body: reSendConfirmEmailSchema.body.safeExtend({
    password: generalValidationFields.password,
    FCM: z.string().optional()
  }),
};

export const signupSchema = {
  body: loginSchema.body.safeExtend({
      username: generalValidationFields.username,
      confirmPassword: generalValidationFields.confirmPassword,
      phone: generalValidationFields.phone.optional(),
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
    email: generalValidationFields.email,
  }),
};

export const resetPasswordSchema = {
  body: forgotPasswordSchema.body.safeExtend({
    otp: generalValidationFields.otp,
    password: generalValidationFields.password,
    confirmPassword: generalValidationFields.confirmPassword,
  }).refine(
    (data) => data.password === data.confirmPassword,
    {
      error: "password mismatch with confirm password",
    },
  ),
};