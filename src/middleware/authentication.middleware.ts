import { NextFunction, Request, Response } from "express";
import { UnauthorizedException } from "../common/exceptions";
import { TokenService } from "../common/services";
import { tokenTypeEnum } from "../common/Enums";

export const authentication = (
  tokenType: tokenTypeEnum = tokenTypeEnum.ACCESS,
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const Service = new TokenService();

    const [key, credential] = req.headers.authorization?.split(" ") || [];
    console.log({ key, credential });

    if (!key || !credential) {
      throw new UnauthorizedException("Missing authorization");
    }

    switch (key) {
      case "Basic":
        // Handle Basic authentication
        break;
      default:
        const { decode, user } = await Service.decodeToken({
          token: credential,
          tokenType,
        });
        req.user = user;
        req.decoded = decode;
        break;
    }

    next();
  };
};
