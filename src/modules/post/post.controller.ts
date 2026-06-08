import {Router} from "express";
import { authentication,validation} from "../middleware";
import { successResponse } from "../../common/response";
import { Request, Response, NextFunction } from "express";
import {cloudFileUplad , fileFieldValidation } from "../../common/utils/multer";
import * as validators from "./post.validation"
import { postService } from "./post.service";
import { PaginateDto, paginationValidationSchema } from "../../common/validation";
import {reactPostParamsDto, reactPostQueryDto, UpdatePostBodyDto, UpdatePostParamsDto} from "./post.dto"
import { CommentRouter } from "../comment";
const router = Router();
router.use("/:postId/comment", CommentRouter);
router.get(
    "/",
    authentication(),
    validation(paginationValidationSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
        const data = await postService.postList(req.query as PaginateDto ,req.user);
        return successResponse({ res, status: 200, data });
    }
);
router.post(
    "/",
    authentication(),
    cloudFileUplad({ validation: fileFieldValidation.image }).array("attachments", 2),
    validation(validators.createPost),
    async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
        const data = await postService.createPost({...req.body, files: req.files}, req.user) 
        return successResponse({ res, status: 201 , data })
    }
)

router.patch(
    "/:postId/react",
    authentication(),
    validation(validators.reactPost),
    async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
        const data = await postService.reactPost(req.params as reactPostParamsDto , req.query as unknown as reactPostQueryDto, req.user) 
        return successResponse({ res, status: 200 , data })
    }
)


router.patch(
    "/:postId",
    authentication(),
    cloudFileUplad({ validation: fileFieldValidation.image }).array("attachments", 2),
    validation(validators.updatePost),
    async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
        const data = await postService.updatePost(req.params as UpdatePostParamsDto , req.body as UpdatePostBodyDto, req.user) 
        return successResponse({ res, status: 200 , data })
    }
)
export default router;