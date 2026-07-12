import { NextFunction, Request, Response } from "express";
import { UnauthorizedExeption } from "../common/exception";
import { TokenService } from "../common/services";
import { TokenTypeEnum,  } from "../common/enums";

export const authentication = (
  tokenType: TokenTypeEnum = TokenTypeEnum.ACCESS,
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const Service = new TokenService();

    const [key, credential] = req.headers.authorization?.split(" ") || [];
    console.log({ key, credential });

    if (!key || !credential) {
      throw new UnauthorizedExeption("Missing authorization");
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
