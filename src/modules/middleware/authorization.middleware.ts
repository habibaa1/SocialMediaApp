import { NextFunction , Request,Response} from "express"

import { RoleEnum } from "../../common/enums";
import { ForbiddenExeption } from "../../common/exception";

export const authorization = (accessRoles:RoleEnum[]) => {
    return (req:Request, res:Response, next:NextFunction) => {
        if (!accessRoles.includes(req.user.role)) {
            throw new ForbiddenExeption( "Not authorized account" );
        }
        return next();
    };
};
