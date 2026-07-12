import {
  confirmEmailDto,
  forgotPasswordDto,
  LoginDto,
  ResendConfirmEmailDto,
  resetPasswordDto,
  SignupDto,
} from "./auth.dto";
import { DeleteResult, HydratedDocument } from "mongoose";
import {
  BadRequestExaption,
  ConflictExeption,
  NotFoundExeption,
  UnauthorizedExeption,
} from "../../common/exception";
import { compareHash } from "../../common/utils/security/hash.security";

import { UserRepository } from "../../DB/repository";
import {
  redisService,
  RedisService,
} from "../../common/services/redis.service";
import { EmailEnum, ProviderEnum } from "../../common/enums";
import { NotificationService, TokenService } from "../../common/services";
import { IUser } from "../../common/interfaces";
import { ILoginResponse } from "./auth.entity";
import { OAuth2Client, TokenPayload } from "google-auth-library";
import { CLIENT_IDS } from "../../config/config";

/* ================= SERVICE ================= */

export class AuthenticationService {
  private readonly userRepository: UserRepository;
  private readonly redis: RedisService;
  private readonly tokens: TokenService;
  private readonly notification: NotificationService;

  constructor() {
    this.userRepository = new UserRepository();
    this.redis = redisService;
    this.tokens = new TokenService();
    this.notification = new NotificationService();
  }

  //     LOGIN

  public async login(
    inputs: LoginDto,
    issuer: string,
  ): Promise<ILoginResponse> {
    const { email, password, FCM } = inputs;

    const user = await this.userRepository.findOne({
      filter: {
        email,
        provider: ProviderEnum.SYSTEM
      },
    });

    if (!user) {
      throw new NotFoundExeption("Invalid credentials");
    }

    if (!user.confirmEmail) {
      throw new UnauthorizedExeption("Please confirm your email first");
    }

    if (!user.password) {
      throw new UnauthorizedExeption(
        "This account uses Google login. Please sign in with Google.",
      );
    }

    if (FCM) {
      const userId = user._id.toString();
      await this.redis.addFCM(userId, FCM);
      const tokens = await this.redis.getFCMs(userId);
      if (tokens?.length) {
        await this.notification.sendNotifications({
          tokens,
          data: {
            title: "Login",
            body: `New Login at ${new Date()}`,
          },
        });
      }
    }

    const isMatch = await compareHash({
      plaintext: password,
      ciphertext: user.password,
    });

    if (!isMatch) {
      throw new NotFoundExeption("Invalid credentials........");
    }

    return await this.tokens.createLoginCredentials(
      user as unknown as HydratedDocument<IUser>,
      issuer,
    );
  }

  //     SIGNUP

  public async signup(data: SignupDto): Promise<IUser> {
    const exists = await this.findUserByEmail(data.email);

    if (exists) {
      throw new ConflictExeption("User already exists");
    }

    const user = await this.createUser(data);

    if (!user) {
      throw new BadRequestExaption("User creation failed");
    }

    await this.redis.sendEmailOtp({
      email: data.email,
      subject: EmailEnum.CONFIRM_EMAIL,
      title: "Verify Email",
    });

    return user;
  }

  //     CONFIRM EMAIL

  public async confirmEmail({ email, otp }: confirmEmailDto) {
    const hashOtp = await this.redis.get(
      this.redis.otpKey({ email, type: EmailEnum.CONFIRM_EMAIL }),
    );
    if (!hashOtp) {
      throw new NotFoundExeption("OTP expired or invalid");
    }

    const account = (await this.userRepository.findOne({
      filter: {
        email,
        confirmEmail: { $exists: false },
        provider: ProviderEnum.SYSTEM,
      },
    })) as HydratedDocument<IUser>;
    if (!account) {
      throw new NotFoundExeption("Account not found or already confirmed");
    }

    if (!(await compareHash({ plaintext: otp, ciphertext: hashOtp }))) {
      throw new ConflictExeption("Invalid OTP");
    }

    account.confirmEmail = new Date();
    await account.save();

    await this.redis.deleteKey(
      this.redis.otpKey({ email, type: EmailEnum.CONFIRM_EMAIL }),
    );
    return { message: "Email confirmed successfully" };
  }

  //     RESEND CONFIRM EMAIL

  public async reSendConfirmEmail({ email }: ResendConfirmEmailDto) {
    const account = await this.userRepository.findOne({
      filter: {
        email,
        confirmEmail: { $exists: false },
        provider: ProviderEnum.SYSTEM,
      },
    });
    if (!account) {
      throw new NotFoundExeption("Account not found or already confirmed");
    }

    await this.redis.sendEmailOtp({
      email,
      subject: EmailEnum.CONFIRM_EMAIL,
      title: "Verify Email",
    });

    return { message: "OTP resent successfully" };
  }

  //    GOOGLE OATH

  // verify Google Account
  private async verifyGoogleAccount(idToken: string): Promise<TokenPayload> {
    const client = new OAuth2Client();
    const ticket = await client.verifyIdToken({
      idToken,
      audience: CLIENT_IDS,
    });
    const payload = ticket.getPayload();
    if (!payload?.email_verified) {
      throw new BadRequestExaption("Fail to verify this account with Google");
    }
    return payload;
  }
  // login With Gmail
  async loginWithGmail(idToken: string, issuer: string) {
    const payload = await this.verifyGoogleAccount(idToken);
    const user = await this.userRepository.findOne({
      filter: {
        email: payload.email as string,
        provider: ProviderEnum.GOOGLE,
      },
    });
    if (!user) {
      throw new NotFoundExeption("Invalid login data");
    }
    return await this.tokens.createLoginCredentials(
      user as HydratedDocument<IUser>,
      issuer,
    );
  }
  // signup With Gmail
  async signupWithGmail(idToken: string, issuer: string) {
    const payload = await this.verifyGoogleAccount(idToken);

    const checkUserExist = await this.userRepository.findOne({
      filter: {
        email: payload.email as string,
      },
    });
    if (checkUserExist) {
      if (checkUserExist?.provider == ProviderEnum.SYSTEM) {
        throw new ConflictExeption(
          "Account already exist with different provider",
        );
      }
      const account = await this.loginWithGmail(idToken, issuer);
      return { account, status: 200 };
    }

    const user = await this.userRepository.createOne({
      data: {
        firstName: payload.given_name as string,
        lastName: payload.family_name as string,
        email: payload.email as string,
        profileImage: payload.picture as string,
        provider: ProviderEnum.GOOGLE,

        confirmEmail: new Date(),
      },
    });

    return {
      status: 201,
      Credential: await this.tokens.createLoginCredentials(user, issuer),
    };
  }

  //     forgotPassword

  public async forgotPassword({ email }: forgotPasswordDto) {
    const user = await this.userRepository.findOne({
      filter: {
        email,
        provider: ProviderEnum.SYSTEM,
      },
    });

    if (!user) {
      throw new NotFoundExeption("User not found");
    }

    await this.redis.sendEmailOtp({
      email,
      subject: EmailEnum.RESET_PASSWORD,
      title: "Reset Password",
    });

    return { message: "Reset password OTP sent successfully" };
  }

  //     resetPassword

  public async resetPassword({ email, otp, password }: resetPasswordDto) {
    const hashOtp = await this.redis.get(
      this.redis.otpKey({ email, type: EmailEnum.RESET_PASSWORD }),
    );

    if (!hashOtp) {
      throw new NotFoundExeption("OTP expired or invalid");
    }

    const user = (await this.userRepository.findOne({
      filter: {
        email,
        provider: ProviderEnum.SYSTEM,
      },
    })) as HydratedDocument<IUser>;

    if (!user) {
      throw new NotFoundExeption("User not found");
    }

    const isValidOtp = await compareHash({
      plaintext: otp,
      ciphertext: hashOtp,
    });

    if (!isValidOtp) {
      throw new ConflictExeption("Invalid OTP");
    }

    // The User model hashes modified passwords in its pre-save hook.
    user.password = password;
    await user.save();

    await this.redis.deleteKey(
      this.redis.otpKey({ email, type: EmailEnum.RESET_PASSWORD }),
    );

    return { message: "Password reset successfully" };
  }

  /* ================= HELPERS ================= */

  public async findUserByEmail(email: string): Promise<IUser | null> {
    const user = await this.userRepository.findOne({
      filter: { email },
      projection: { email: 1 },
    });

    return user ? this.normalizeUser(user) : null;
  }

  public async createUser(data: SignupDto): Promise<IUser> {
    const securedData = await this.secureUserData(data);

    const user = await this.userRepository.createOne({ data: securedData });

    if (!user) throw new BadRequestExaption("User creation failed");

    return this.normalizeUser(user);
  }

  private async secureUserData(data: SignupDto) {
    const { username, confirmPassword: _confirmPassword, FCM: _FCM, ...userData } =
      data;
    const nameParts = username.trim().split(/\s+/);
    const firstName = nameParts[0] ?? username;
    const lastName = nameParts.slice(1).join(" ") || firstName;

    return {
      ...userData,
      firstName,
      lastName,
      slug: `${firstName}-${lastName}`.toLowerCase(),
    };
  }

  public async deleteUsers(
    filter: Partial<IUser> | Record<string, unknown>,
    options?: any,
  ): Promise<DeleteResult> {
    return this.userRepository.deleteMany({ filter });
  }

  private normalizeUser(user: any): IUser {
    return user?.toJSON?.() ?? (user as IUser);
  }
}

export default new AuthenticationService();
