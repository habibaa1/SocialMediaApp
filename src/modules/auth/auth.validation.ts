import { z} from "zod";
import { generalValidationFields} from "../../common/validation";

export const resendConfirmEmail ={
    body:z.strictObject({
        email: generalValidationFields.email,

    })
}
export const ConfirmEmail ={
    body:resendConfirmEmail.body.safeExtend({
        otp: generalValidationFields.otp,

    })
}
export const login ={
    body:resendConfirmEmail.body.safeExtend({
        // email:z.email({error: "email is mandatory"}),
        // email: generalValidationFields.email,
        // password:z.string({error: "password is mandatory"}).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*\w).{8,16}$/, {error:"weak password"}),
        password: generalValidationFields.password,
        FCM:z.string().optional()
    })
}

export const signup ={
    // params:z.strictObject({
    //     userId:z.string()
    // }),
    body:login.body.safeExtend({
        username: generalValidationFields.username,
        phone: generalValidationFields.phone.optional(),
        confirmPassword: generalValidationFields.confirmPassword 
        // username:z.string({error: "username is mandatory"}).min(2,{error:"min is 2 characters"}).max(25,{error:"max is 25 characters"}),
        // confirmPassword:z.string()
    }).refine((data) =>{
        return data.password === data.confirmPassword},
        {message:"password and confirm password must be the same",})
}
export const resetForgotPassword = {
    body: z.strictObject({
        email: generalValidationFields.email,
        otp: generalValidationFields.otp,
        password: generalValidationFields.password,
        confirmPassword: generalValidationFields.confirmPassword
    }).refine((data) => {
        return data.password === data.confirmPassword;
    }, {
        message: "password and confirm password must be the same",
        path: ["confirmPassword"] // عشان الخطأ يظهر عند حقل التأكيد
    })
};

    // .superRefine((data,ctx)=>{
    //     if(data.password !== data.confirmPassword){
    //         ctx.addIssue({
    //             path:["confirmPassword"],
    //             message: "password and confirm password must be the same",
    //             code: "custom"})
    // .refine((data) =>{
    //     return data.password === data.confirmPassword},
    //     {message:"password and confirm password must be the same",})
// }