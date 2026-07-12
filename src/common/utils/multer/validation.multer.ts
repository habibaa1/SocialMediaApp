import { Request } from "express";
import { FileFilterCallback } from "multer";

export const fileFieldValidation = {
    image: ['image/jpeg', 'image/jpg', 'image/png'],
    video: ['video/mp4']
}

export const fileFilter = (validation: string[]) => {
    return function (req: Request, file: Express.Multer.File, cb: FileFilterCallback) {
        console.log(file.mimetype);

        if (!validation.includes(file.mimetype)) {
            return cb(new Error("Invalid file format", { cause: { status: 400 } }))
        }

        return cb(null, true)
    }
}