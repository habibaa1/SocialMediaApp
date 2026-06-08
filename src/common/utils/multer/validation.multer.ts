import  {type Request } from "express";
import { FileFilterCallback } from "multer";
import { BadRequestExaption } from "../../exception";
export const fileFieldValidation = {
    image: ['image/jpeg', 'image/jpg', 'image/png'],
    video: ['video/mp4']
};


export const fileFilter = (validation: string[]) => {
    return (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
        console.log(file.mimetype);

        if (!validation.includes(file.mimetype)) {
            return cb(new BadRequestExaption("invalied file format"));
        }

        return cb(null, true);
    };
};