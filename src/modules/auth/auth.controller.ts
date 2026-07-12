import { NextFunction, Router, Request, Response } from "express";
import authService from "./auth.service";
import { successResponse } from "../../common/response";
import * as validators from "./auth.validation";
import { validation } from "../../middleware";
import { ILoginResponse } from "./auth.entity";
const router = Router();

//     LOGIN
router.post(
  "/login",
  validation(validators.loginSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await authService.login(
        req.body,
        `${req.protocol}://${req.get("host")}`,
      );

      successResponse<ILoginResponse>({
        res,
        data,
      });
    } catch (error) {
      next(error);
    }
  },
);

//    SIGNUP
router.post(
  "/signup",
  validation(validators.signupSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await authService.signup(req.body);

      successResponse({
        res,
        status: 201,
        message: "Signup successful",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
);

//    CONFIRM EMAIL
router.patch(
  "/confirm-email",
  validation(validators.confirmEmailSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const account = await authService.confirmEmail(req.body);

      successResponse({
        res,
        data: account,
      });
    } catch (error) {
      next(error);
    }
  },
);

//     RESEND CONFIRM EMAIL
router.patch(
  "/resend-confirm-email",
  validation(validators.reSendConfirmEmailSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const account = await authService.reSendConfirmEmail(req.body);

      successResponse({
        res,
        data: account,
      });
    } catch (error) {
      next(error);
    }
  },
);

//     FORGOT PASSWORD
router.post(
  "/forgot-password",
  validation(validators.forgotPasswordSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await authService.forgotPassword(req.body);
      successResponse({
        res,
        data,
      });
    } catch (error) {
      next(error);
    }
  },
);

//     RESET PASSWORD
router.patch(
  "/reset-password",
  validation(validators.resetPasswordSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await authService.resetPassword(req.body);
      successResponse({
        res,
        data,
      });
    } catch (error) {
      next(error);
    }
  },
);

//     SIGNUP WITH GMAIL
router.post(
  "/signup/gmail",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await authService.signupWithGmail(
        req.body,
        `${req.protocol}://${req.get("host")}`,
      );

      successResponse({
        res,
        status: 201,
        message: "Gmail signup successful",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
);

//     LOGIN WITH GMAIL
router.post(
  "/login/gmail",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await authService.loginWithGmail(
        req.body,
        `${req.protocol}://${req.get("host")}`,
      );

      successResponse({
        res,
        message: "Gmail login successful",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
);
export default router;
