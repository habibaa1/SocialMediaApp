import {type NextFunction,type Request,type Response, Router} from "express";
import { successResponse } from "../../common/response";
import userService from "./user.service";
import { authentication, authorization} from "../middleware";
import { endpoint } from "./user.authorization";
import { StorageApproachEnum, TokenTypeEnum } from "../../common/enums";
import { cloudFileUplad, fileFieldValidation } from "../../common/utils/multer";
const router = Router()

router.patch("/profile-image", 
    authentication(),
    // cloudFileUplad({
    //     validation:fileFieldValidation.image,
    //     storageApproach:StorageApproachEnum.DISK,
    // }).single("attachment"),
    async (req:Request, res:Response,next:NextFunction)=>{
    const data = await userService.profileImage(req.body ,req.user)
    return successResponse ({res,data})
})
router.patch("/profile-cover-images",
    authentication(),
    cloudFileUplad({
        validation: fileFieldValidation.image,
        storageApproach: StorageApproachEnum.DISK
    }).array("attachments", 2),
    async (req: Request, res: Response, next: NextFunction) => {
        const data = await userService.profileCoverImages(req.files as Express.Multer.File[], req.user)
        return successResponse({ res, data })
    }
)
router.get("/", 
    authentication(),
    authorization(endpoint.profile),
    async (req:Request, res:Response,next:NextFunction)=>{
    const data = await userService.profile(req.user)
    return successResponse ({res,data})
})
router.post("/logout", authentication(), async (req, res, next) => {
    const status = await userService.logout(req.body, req.user, req.decoded as { jti: string, iat: number, sub: string })
    
    return successResponse({ res, status })
})

router.post("/rotate-token", authentication(TokenTypeEnum.REFRESH), async (req, res, next) => {
    const credentials = await userService.rotateToken(req.user, req.decoded as { jti: string, iat: number, sub: string }, `${req.protocol}://${req.get('host')}`)
    
    return successResponse({ res, status: 201, data: { ...credentials } })
})

router.delete("/", 
    authentication(),
    // cloudFileUplad({
    //     validation:fileFieldValidation.image,
    //     storageApproach:StorageApproachEnum.DISK,
    // }).single("attachment"),
    async (req:Request, res:Response,next:NextFunction)=>{
    const data = await userService.deleteProfile(req.user)
    return successResponse ({res,data})
})

export default router