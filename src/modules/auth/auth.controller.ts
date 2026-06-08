import {  NextFunction, Router,type Request,type Response } from "express";
import authService from "./auth.service";
import { successResponse } from "../../common/response";
// import { ISignupResspones } from "./auth.entities";
import * as validators from "./auth.validation";  
// import { BadRequestExaption } from "../../common/exception";
import { validation } from "../middleware";
import { IUser } from "../../common/interfaces";
import { ILoginRessponse } from "./auth.entities";

const router= Router();

router.post(
    "/signup",validation(validators.signup),async (req: Request, res: Response)=>{
    let data = await authService.signup(req.body);
    successResponse<IUser>({res,status:201,data})
});

router.post(
    "/login",
    validation(validators.login),
    async (req: Request, res: Response,  next:NextFunction ): Promise<Response> =>{
    const data = await authService.login(req.body, `${req.protocol}://${req.host}`)
    return successResponse<ILoginRessponse>({res,data})
        // const validationResult =validators.login.body.safeParse(req.body);
        // console.log({validationResult});
        // if(!validationResult.success){
        //     throw new BadRequestExaption("validation error",{error: JSON.parse(validationResult.error as unknown as string)})
        // }
    // return res.status(200).json({message:"done login",data})
    // const data  = authService.login(req.body);
    // return successResponse<ILoginRessponse>({res,data })
})

// router.post("/signup",async(req: Request, res: Response ,next: NextFunction): Promise<Response> =>{
//         const validationResult =validators.signup.body.safeParse(req.body);
//         if(!validationResult.success){
//             throw new BadRequestExaption("validation error",{error: JSON.parse(validationResult.error as unknown as string)})
//         }
//     // try {
//     //     const data = await signupSchema.body.parseAsync(req.body);
//     // } catch (error) {
//     //     throw new BadRequestExaption("validation error",{error: JSON.parse(error as string)})
//     // }
//     const data  = authService.signup(req.body);
//     return successResponse<ISignupResspones>({res,status:201,data})
//     // return successResponse<ILoginRessponse>({res,data })
// })
router.patch(
    "/confirm-email",
    validation(validators.ConfirmEmail),
    async (req, res, next) => {
        await authService.confirmEmail(req.body);
        return successResponse({ res });
    }
);
router.patch(
    "/resend-confirm-email",
    validation(validators.resendConfirmEmail),
    async (req, res, next) => {
        await authService.resendConfirmEmail(req.body);
        return successResponse({ res });
    }
);
router.post("/signup/gmail", async (req, res, next) => {
    console.log(req.body);

    const { status, credentials } = await authService.signupWithGmail(req.body.idToken, `${req.protocol}://${req.host}`);

    return successResponse({ res, status, data: { credentials } });
});

router.post(
    "/forgot-password",
    validation(validators.resendConfirmEmail),
    async (req, res, next) => { 
        try {
            await authService.requestForgotPasswordOtp(req.body);
            res.status(200).json({ message: "Reset code sent to your email" });
        } catch (error) {
            next(error); 
        }
    }
);

router.post(
    "/verify-forgot-password",
    validation(validators.ConfirmEmail),
    async (req, res, next) => {
        try {
            await authService.verifyForgotPasswordOtp(req.body);
            res.status(200).json({ message: "OTP verified successfully" });
        } catch (error) {
            next(error);
        }
    }
);

router.patch(
    "/reset-password",
    validation(validators.resetForgotPassword),
    async (req, res, next) => {
        try {
            await authService.resetForgotPasswordOtp(req.body);
            res.status(200).json({ message: "Password updated successfully" });
        } catch (error) {
            next(error);
        }
    }
);


export default router;
