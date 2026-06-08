import multer from "multer"
import type { Request } from "express"
import { randomUUID } from "node:crypto"
import {tmpdir} from "node:os"
import { StorageApproachEnum } from "../../enums"
import { fileFilter } from "./validation.multer"

export const cloudFileUplad =({
    storageApproach=StorageApproachEnum.MEMORY,
    validation=[],
    maxSize = 2
}:{
    storageApproach?:StorageApproachEnum,
    validation?:string[],
    maxSize?:number
})=>{
    // console.log(tmpdir());
    // const storage = multer.memoryStorage()
    const storage = storageApproach==StorageApproachEnum.MEMORY? multer.memoryStorage(): multer.diskStorage({
        destination: function(req:Request, file:Express.Multer.File, callback:(error:Error | null , destination:string) => void) {
            callback(null,tmpdir())
        },
        filename: function(req:Request, file:Express.Multer.File, callback:(error:Error | null , destination:string) => void) {
            callback(null,`${randomUUID()}__${file.originalname}`)
        },
    })

    return multer({fileFilter:fileFilter(validation) ,storage, limits:{fileSize:maxSize * 1024 * 1024}})
}