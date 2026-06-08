import {Router} from "express";
import { authentication,validation} from "../middleware";
import { successResponse } from "../../common/response";
import { Request, Response, NextFunction } from "express";
import {cloudFileUplad , fileFieldValidation } from "../../common/utils/multer";
import * as validators from "./comment.validation"
import { commentService } from "./comment.service";
import { createCommentParamsDto , createReplyOnCommentParamsDto } from "./comment.dto";
import { IComment } from "../../common/interfaces";
const router = Router({ mergeParams: true });

router.post(
    "/",
    authentication(),
    cloudFileUplad({ validation: fileFieldValidation.image }).array("attachments", 2),
    validation(validators.createComment),
    async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
        const data = await commentService.createComment(req.params as createCommentParamsDto,{...req.body, files: req.files}, req.user) 
        return successResponse<IComment>({ res, status: 201 , data })
    }
)

router.post(
    "/:commentId/reply",
    authentication(),
    cloudFileUplad({ validation: fileFieldValidation.image }).array("attachments", 2),
    validation(validators.replyOnComment),
    async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
        const data = await commentService.replyOnComment(req.params as createReplyOnCommentParamsDto,{...req.body, files: req.files}, req.user) 
        return successResponse<IComment>({ res, status: 201 , data })
    }
)


export default router;