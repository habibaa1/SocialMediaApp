import type { NextFunction, Response } from "express";
import { HydratedDocument } from "mongoose";

import { RoleEnum } from "../common/Enums";
import {
  ForbiddenException,
  MapGraphQLError,
} from "../common/exceptions";

import { IUser } from "../common/interface";

export const authorization = (
  accessRoles: RoleEnum[]
) => {

  return async (
    req: any,
    res: Response,
    next: NextFunction
  ) => {

    if (!req.user) {
      throw new ForbiddenException("Unauthorized");
    }

    if (!accessRoles.includes(req.user.role)) {
      throw new ForbiddenException("Not allowed account");
    }

    next();
  };
};

export const GQLAuthorization = async (
  accessRoles: RoleEnum[],
  user: HydratedDocument<IUser>
): Promise<boolean> => {

  if (!accessRoles.includes(user.role)) {

    throw MapGraphQLError(
      new ForbiddenException("Not authorized account")
    );
  }

  return true;
};