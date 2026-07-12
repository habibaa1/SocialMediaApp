import type { NextFunction, Response } from "express";
import { HydratedDocument } from "mongoose";

import { RoleEnum } from "../common/enums";
import {
  ForbiddenExeption,
  MapGraphQLError,
} from "../common/exception";

import { IUser } from "../common/interfaces";

export const authorization = (
  accessRoles: RoleEnum[]
) => {

  return async (
    req: any,
    res: Response,
    next: NextFunction
  ) => {

    if (!req.user) {
      throw new ForbiddenExeption("Unauthorized");
    }

    if (!accessRoles.includes(req.user.role)) {
      throw new ForbiddenExeption("Not allowed account");
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
      new ForbiddenExeption("Not authorized account")
    );
  }

  return true;
};