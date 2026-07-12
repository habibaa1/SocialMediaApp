import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";
import {
  ACCESS_EXPIRES_IN,
  REFRESH_EXPIRES_IN,
  System_REFRESH_TOKEN_SECRET_KEY,
  System_TOKEN_SECRET_KEY,
  User_REFRESH_TOKEN_SECRET_KEY,
  User_TOKEN_SECRET_KEY,
} from "../../config/config";
import { RoleEnum, tokenTypeEnum } from "../Enums";
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from "../exceptions";
import { RedisService, redisService } from "./redis.service";
import { UserRepository } from "../../DB/repository";
import { HydratedDocument, Types } from "mongoose";
import { IUser } from "../interface";
import { randomUUID } from "crypto";
import { ILoginResponse } from "../../modules/auth/auth.entity";

type signatureType = {
  accessSignature: string;
  refreshSignature: string;
};
type decodeType = {
  token: string;
  tokenType: tokenTypeEnum;
};

export class TokenService {
  static tokenTypeEnum: any;
  static decodeToken(arg0: { token: any; tokenType: any; }): { user: any; decoded: any; } | PromiseLike<{ user: any; decoded: any; }> {
    throw new Error("Method not implemented.");
  }
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
    tokenType = tokenTypeEnum.ACCESS,
    signatureLevel: RoleEnum,
  ): Promise<string> => {
    const signatures = await this.detectSignatureLevel(signatureLevel);
    let signature;
    switch (tokenType) {
      case tokenTypeEnum.ACCESS:
        signature = signatures.accessSignature;
        break;
      case tokenTypeEnum.REFRESH:
        signature = signatures.refreshSignature;
        break;
    }
    return signature;
  };

  decodeToken = async ({
    token,
    tokenType = tokenTypeEnum.ACCESS,
  }: decodeType): Promise<{
    user: HydratedDocument<IUser>;
    decode: JwtPayload;
  }> => {
    const decoded = jwt.decode(token) as JwtPayload | null;

    if (!decoded) {
      throw new BadRequestException("Invalid token");
    }

    if (!Array.isArray(decoded.aud)) {
      throw new BadRequestException("Invalid token audience format");
    }

    const [tokenApproach, signatureLevel] = decoded.aud;

    if (tokenApproach === undefined || signatureLevel === undefined) {
      throw new BadRequestException("Invalid token audience format");
    }

    if (tokenType !== (tokenApproach as unknown as tokenTypeEnum)) {
      throw new BadRequestException(
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
      throw new UnauthorizedException("Invalid login session");
    }

    const secret = await this.getSignature(
      tokenApproach as unknown as tokenTypeEnum,
      signatureLevel as RoleEnum,
    );

    const verifiedData = jwt.verify(token, secret) as JwtPayload;

    if (!verifiedData?.sub) {
      throw new BadRequestException("Invalid token payload");
    }

    const user = await this.userRepository.findOne({
      filter: { _id: verifiedData.sub },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    if (
      user.changeCredentialsTime &&
      verifiedData.iat &&
      user.changeCredentialsTime.getTime() >= verifiedData.iat * 1000
    ) {
      throw new UnauthorizedException("Invalid login session");
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
          tokenTypeEnum.ACCESS as unknown as string,
          user.role as unknown as RoleEnum,
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
          tokenTypeEnum.REFRESH as unknown as string,
          user.role as unknown as RoleEnum,
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
