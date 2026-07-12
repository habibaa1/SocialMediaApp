import { HydratedDocument } from "mongoose";
import { IUser } from "../interfaces";
import { JwtPayload } from "jsonwebtoken";
import { Socket } from "socket.io";
import { Request as ExpressRequest } from "express";

declare module "express-serve-static-core" {
    interface Request {
    user: HydratedDocument<IUser>;
    decoded: JwtPayload;
    }
}

export interface IAuthUser {
    user: HydratedDocument<IUser>;
    decoded: JwtPayload;
}
export interface IAuthSocket extends Socket {
    data: IAuthUser;
}

export interface IAuthenticatedRequest extends ExpressRequest {
    user: HydratedDocument<IUser>;
    decoded: JwtPayload;
}
