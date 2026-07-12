import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";
import {
  ACCESS_EXPIRES_IN,
  REFRESH_EXPIRES_IN,
  System_TOKEN_SECRET_KEY,
  System_REFRESH_TOKEN_SECRET_KEY,
  User_TOKEN_SECRET_KEY,
  User_REFRESH_TOKEN_SECRET_KEY,
} from "../../config/config";
import { RoleEnum, TokenTypeEnum } from "../enums";
import {
  BadRequestExaption,
  NotFoundExeption,
  UnauthorizedExeption,
} from "../exception";
import { RedisService, redisService } from "./redis.service";
import { UserRepository } from "../../DB/repository";
import { HydratedDocument, Types } from "mongoose";
import { IUser } from "../interfaces";
import { randomUUID } from "crypto";
import { ILoginResponse } from "../../modules/auth/auth.entity";

type signatureType = {
  accessSignature: string;
  refreshSignature: string;
};
type decodeType = {
  token: string;
  tokenType?: TokenTypeEnum;
};

export class TokenService {
  private readonly userRepository: UserRepository;
  private readonly redis: RedisService;

  constructor() {
    this.userRepository = new UserRepository();
    this.redis = redisService;
  }

  sign = async ({
    payload,
    secret = User_TOKEN_SECRET_KEY,
    options,
  }: {
    payload: object;
    secret?: string;
    options?: SignOptions;
  }): Promise<string> => {
    return jwt.sign(payload, secret, options);
  };

  verify = async ({
    token,
    secret = User_TOKEN_SECRET_KEY,
    options,
  }: {
    token: string;
    secret?: string;
    options?: SignOptions;
  }): Promise<JwtPayload> => {
    return jwt.verify(token, secret) as JwtPayload;
  };

  detectSignatureLevel = async (role: RoleEnum): Promise<signatureType> => {
    let signatureLevel: signatureType;
    switch (role) {
      case RoleEnum.ADMIN:
        signatureLevel = {
          accessSignature: System_TOKEN_SECRET_KEY,
          refreshSignature: System_REFRESH_TOKEN_SECRET_KEY,
        };
        break;
      default:
        signatureLevel = {
          accessSignature: User_TOKEN_SECRET_KEY,
          refreshSignature: User_REFRESH_TOKEN_SECRET_KEY,
        };
        break;
    }
    return signatureLevel;
  };

  getSignature = async (
    tokenType: TokenTypeEnum = TokenTypeEnum.ACCESS,
    signatureLevel: RoleEnum,
  ): Promise<string> => {
    const signatures = await this.detectSignatureLevel(signatureLevel);
    switch (tokenType) {
      case TokenTypeEnum.ACCESS:
        return signatures.accessSignature;
      case TokenTypeEnum.REFRESH:
        return signatures.refreshSignature;
      default:
        throw new BadRequestExaption("Invalid token type");
    }
  };

  decodeToken = async ({
    token,
    tokenType = TokenTypeEnum.ACCESS,
  }: decodeType): Promise<{
    user: HydratedDocument<IUser>;
    decode: JwtPayload;
  }> => {
    const decoded = jwt.decode(token) as JwtPayload | null;

    if (!decoded) {
      throw new BadRequestExaption("Invalid token");
    }

    if (!Array.isArray(decoded.aud)) {
      throw new BadRequestExaption("Invalid token audience format");
    }

    const [tokenApproach, signatureLevel] = decoded.aud;

    if (tokenApproach === undefined || signatureLevel === undefined) {
      throw new BadRequestExaption("Invalid token audience format");
    }

    const parsedTokenType = Number(tokenApproach);
    if (
      (parsedTokenType !== TokenTypeEnum.ACCESS &&
        parsedTokenType !== TokenTypeEnum.REFRESH) ||
      (signatureLevel !== RoleEnum.ADMIN && signatureLevel !== RoleEnum.USER)
    ) {
      throw new BadRequestExaption("Invalid token audience format");
    }

    if (tokenType !== parsedTokenType) {
      throw new BadRequestExaption(
        `Invalid token type. Only ${tokenType} allowed for this endpoint`,
      );
    }

    if (
      decoded.jti &&
      (await this.redis.get(
        this.redis.revokeTokenKey({
          userId: decoded.sub as string,
          jti: decoded.jti,
        }),
      ))
    ) {
      throw new UnauthorizedExeption("Invalid login session");
    }

    const secret = await this.getSignature(
      parsedTokenType,
      signatureLevel,
    );

    const verifiedData = jwt.verify(token, secret) as JwtPayload;

    if (!verifiedData?.sub) {
      throw new BadRequestExaption("Invalid token payload");
    }

    const user = await this.userRepository.findOne({
      filter: { _id: verifiedData.sub },
    });

    if (!user) {
      throw new NotFoundExeption("User not found");
    }

    if (
      user.changeCredentialsTime &&
      verifiedData.iat &&
      user.changeCredentialsTime.getTime() >= verifiedData.iat * 1000
    ) {
      throw new UnauthorizedExeption("Invalid login session");
    }

    return {
      user: user as HydratedDocument<IUser>,
      decode: verifiedData,
    };
  };

  createLoginCredentials = async (
    user: HydratedDocument<IUser>,
    issuer: string,
  ): Promise<ILoginResponse> => {
    const { accessSignature, refreshSignature } =
      await this.detectSignatureLevel(user.role);

    const jwtid = randomUUID();

    const Access_Token = await this.sign({
      payload: { sub: user._id },
      secret: accessSignature,
      options: {
        issuer,
        audience: [
          TokenTypeEnum.ACCESS.toString(),
          user.role,
        ],
        expiresIn: ACCESS_EXPIRES_IN,
        jwtid,
      },
    });

    const Refresh_Token = await this.sign({
      payload: { sub: user._id },
      secret: refreshSignature,
      options: {
        issuer,
        audience: [
          TokenTypeEnum.REFRESH.toString(),
          user.role,
        ],
        expiresIn: REFRESH_EXPIRES_IN,
        jwtid,
      },
    });

    return { Access_Token, Refresh_Token };
  };

  createRevokeToken = async (
  { userId, jti, ttl }: { userId: Types.ObjectId |string; jti: string; ttl: number }
) => {
  await this.redis.set({
    key: this.redis.revokeTokenKey({ userId: userId.toString() , jti }),
    value: jti,
    ttl
  });

  return;
};
}
