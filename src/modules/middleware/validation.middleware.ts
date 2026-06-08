
import type { Request, Response , NextFunction} from "express";
import { BadRequestExaption } from "../../common/exception";
import type { ZodError, ZodType } from "zod";
type KeyRequestType = keyof Request
type ValidationSchemaType =Partial<Record<KeyRequestType, ZodType>>
type ValidationErrorType = Array<{
            key: KeyRequestType,
            issues : Array<{
                message:string,
                path: Array<string|number|undefined|symbol>
            }>
        }>

        
export const validation =(schema: ValidationSchemaType)=>{
    return (req :Request, res: Response ,next: NextFunction)=>{
        const validationErrors : ValidationErrorType  =[]
        for (const key of Object.keys(schema) as KeyRequestType[]){
            if(!schema[key])continue; 
            if (req.file) {
                req.body.file = req.file;
            }

            if (req.files) {
                console.log(req.files);
                req.body.files = req.files;
            }
            const validationResult =schema[key].safeParse(req[key])
            if(!validationResult.success){
                const error = validationResult.error as ZodError
                validationErrors.push({
                    key, issues:error.issues.map(issue=>{
                    return {message:issue.message,path:issue.path}
                })
            })
            }
        }
        if(validationErrors.length){
            throw new BadRequestExaption("validation error", validationErrors)
        }
        next();
    }
}