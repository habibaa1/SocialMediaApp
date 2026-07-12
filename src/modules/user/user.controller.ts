    import {
    type NextFunction,
    type Request,
    type Response,
    Router,
    } from "express";
    import { successResponse } from "../../common/response";
    import userService from "./user.service";
    import { authentication, authorization } from "../../middleware";
    import { endpoint } from "./user.authorization";
    import { StorageApproachEnum, TokenTypeEnum } from "../../common/enums";
    import { cloudFileUpload, fileValidation } from "../../common/utils/multer";
    import { IUser } from "../../common/interfaces";
    import { chatRouter } from "../chat";

    const router = Router();
    router.use("/:userId/chat", chatRouter);

    // ─── GET /profile ─────────────────────────────────────────────────────────────
    router.get(
    "/profile",
    authentication(),
    authorization(endpoint.profile),
    async (req: Request, res: Response, next: NextFunction) => {
        const data = await userService.profile(req.user._id.toString());
        return successResponse({ res, data });
    },
    );

    // ─── POST /logout ─────────────────────────────────────────────────────────────
    router.post(
    "/logout",
    authentication(),
    async (req: Request, res: Response, next: NextFunction) => {
        const status = await userService.logout(
        req.body,
        req.user,
        req.decoded as { jti: string; iat: number; sub: string },
        );
        return successResponse({ res, status });
    },
    );

    // ─── POST /rotate-token ───────────────────────────────────────────────────────
    router.post(
    "/rotate-token",
    authentication(TokenTypeEnum.REFRESH),
    async (req: Request, res: Response, next: NextFunction) => {
        const credential = await userService.rotateToken(
        req.user,
        req.decoded as { jti: string; iat: number; sub: string },
        `${req.protocol}://${req.host}`,
        );
        return successResponse({ res, status: 201, data: { ...credential } });
    },
    );

    // ─── /profile-image ─────────────────────────────────────────────────────
    router.patch(
    "/profile-image",
    authentication(),
    async (req: Request, res: Response, next: NextFunction) => {
        const { ContentType, originalname } = req.body;
        const { user, url } = await userService.profileImage(
        { ContentType, originalname },
        req.user,
        );
        return successResponse<{ user: IUser; uploadUrl: string }>({
        res,
        data: { user, uploadUrl: url },
        message:
            "Pre-signed URL generated. Upload the file directly to uploadUrl using HTTP PUT.",
        });
    },
    );

    // ───/profile-cover-image ───────────────────────────────────────────────
    router.patch(
    "/profile-cover-image",
    authentication(),
    cloudFileUpload({
        validation: fileValidation.image,
        storageApproach: StorageApproachEnum.DISK,
    }).array("attachments", 10),
    async (req: Request, res: Response, next: NextFunction) => {
        const files = req.files as Express.Multer.File[];
        const user = await userService.profileCoverImages(files, req.user);
        return successResponse<IUser>({
        res,
        data: user,
        message: `${files.length} cover image(s) uploaded successfully`,
        });
    },
    );

    // ─── /create-presigned-upload-link ───────────────────────────────────────

    // ─── /file ────────────────────────────────────────────────────────────────

    // ─── /file/download ───────────────────────────────────────────────────────


    // ─── / (soft delete) ───────────────────────────────────────────────────
    router.post(
    "/create-presigned-upload-link",
    authentication(),
    async (req: Request, res: Response, next: NextFunction) => {
        const { uploadUrl, fileKey } = await userService.createPresignedUploadLink(
        req.body,
        req.user,
        );
        return successResponse({
        res,
        data: { uploadUrl, fileKey },
        message:
            "Pre-signed URL generated. Upload the file directly to uploadUrl using HTTP PUT.",
        });
    },
    );

    router.get(
    "/file",
    authentication(),
    async (req: Request, res: Response, next: NextFunction) => {
        const { stream, ContentType } = await userService.streamFile(
        req.query.key as string,
        );
        res.setHeader("Content-Type", ContentType || "application/octet-stream");
        res.set("Cross-Origin-Resource-Policy", "cross-origin");
        await userService.pipeFileTo(stream, res);
        return;
    },
    );

    router.get(
    "/file/download",
    authentication(),
    async (req: Request, res: Response, next: NextFunction) => {
        const downloadUrl = await userService.getDownloadUrl(
        req.query.key as string,
        typeof req.query.name === "string" ? req.query.name : undefined,
        );
        return successResponse({
        res,
        data: { downloadUrl },
        message: "Pre-signed download URL valid for 60 seconds.",
        });
    },
    );

    router.delete(
    "/delete",
    authentication(),
    async (req: Request, res: Response, next: NextFunction) => {
        await userService.softDelete(req.user, req.decoded as { sub: string });
        return successResponse({
        res,
        message: "Account deleted successfully",
        });
    },
    );

    export default router;
