"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthenticationService = void 0;
const exception_1 = require("../../common/exception");
const hash_security_1 = require("../../common/utils/security/hash.security");
const repository_1 = require("../../DB/repository");
const redis_service_1 = require("../../common/services/redis.service");
const enums_1 = require("../../common/enums");
const services_1 = require("../../common/services");
const google_auth_library_1 = require("google-auth-library");
const config_1 = require("../../config/config");
class AuthenticationService {
    userRepository;
    redis;
    tokens;
    notification;
    constructor() {
        this.userRepository = new repository_1.UserRepository();
        this.redis = redis_service_1.redisService;
        this.tokens = new services_1.TokenService();
        this.notification = new services_1.NotificationService();
    }
    async login(inputs, issuer) {
        const { email, password, FCM } = inputs;
        const user = await this.userRepository.findOne({
            filter: {
                email,
                provider: enums_1.ProviderEnum.SYSTEM
            },
        });
        if (!user) {
            throw new exception_1.NotFoundExeption("Invalid credentials");
        }
        if (!user.confirmEmail) {
            throw new exception_1.UnauthorizedExeption("Please confirm your email first");
        }
        if (!user.password) {
            throw new exception_1.UnauthorizedExeption("This account uses Google login. Please sign in with Google.");
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
        const isMatch = await (0, hash_security_1.compareHash)({
            plaintext: password,
            ciphertext: user.password,
        });
        if (!isMatch) {
            throw new exception_1.NotFoundExeption("Invalid credentials........");
        }
        return await this.tokens.createLoginCredentials(user, issuer);
    }
    async signup(data) {
        const exists = await this.findUserByEmail(data.email);
        if (exists) {
            throw new exception_1.ConflictExeption("User already exists");
        }
        const user = await this.createUser(data);
        if (!user) {
            throw new exception_1.BadRequestExaption("User creation failed");
        }
        await this.redis.sendEmailOtp({
            email: data.email,
            subject: enums_1.EmailEnum.CONFIRM_EMAIL,
            title: "Verify Email",
        });
        return user;
    }
    async confirmEmail({ email, otp }) {
        const hashOtp = await this.redis.get(this.redis.otpKey({ email, type: enums_1.EmailEnum.CONFIRM_EMAIL }));
        if (!hashOtp) {
            throw new exception_1.NotFoundExeption("OTP expired or invalid");
        }
        const account = (await this.userRepository.findOne({
            filter: {
                email,
                confirmEmail: { $exists: false },
                provider: enums_1.ProviderEnum.SYSTEM,
            },
        }));
        if (!account) {
            throw new exception_1.NotFoundExeption("Account not found or already confirmed");
        }
        if (!(await (0, hash_security_1.compareHash)({ plaintext: otp, ciphertext: hashOtp }))) {
            throw new exception_1.ConflictExeption("Invalid OTP");
        }
        account.confirmEmail = new Date();
        await account.save();
        await this.redis.deleteKey(this.redis.otpKey({ email, type: enums_1.EmailEnum.CONFIRM_EMAIL }));
        return { message: "Email confirmed successfully" };
    }
    async reSendConfirmEmail({ email }) {
        const account = await this.userRepository.findOne({
            filter: {
                email,
                confirmEmail: { $exists: false },
                provider: enums_1.ProviderEnum.SYSTEM,
            },
        });
        if (!account) {
            throw new exception_1.NotFoundExeption("Account not found or already confirmed");
        }
        await this.redis.sendEmailOtp({
            email,
            subject: enums_1.EmailEnum.CONFIRM_EMAIL,
            title: "Verify Email",
        });
        return { message: "OTP resent successfully" };
    }
    async verifyGoogleAccount(idToken) {
        const client = new google_auth_library_1.OAuth2Client();
        const ticket = await client.verifyIdToken({
            idToken,
            audience: config_1.CLIENT_IDS,
        });
        const payload = ticket.getPayload();
        if (!payload?.email_verified) {
            throw new exception_1.BadRequestExaption("Fail to verify this account with Google");
        }
        return payload;
    }
    async loginWithGmail(idToken, issuer) {
        const payload = await this.verifyGoogleAccount(idToken);
        const user = await this.userRepository.findOne({
            filter: {
                email: payload.email,
                provider: enums_1.ProviderEnum.GOOGLE,
            },
        });
        if (!user) {
            throw new exception_1.NotFoundExeption("Invalid login data");
        }
        return await this.tokens.createLoginCredentials(user, issuer);
    }
    async signupWithGmail(idToken, issuer) {
        const payload = await this.verifyGoogleAccount(idToken);
        const checkUserExist = await this.userRepository.findOne({
            filter: {
                email: payload.email,
            },
        });
        if (checkUserExist) {
            if (checkUserExist?.provider == enums_1.ProviderEnum.SYSTEM) {
                throw new exception_1.ConflictExeption("Account already exist with different provider");
            }
            const account = await this.loginWithGmail(idToken, issuer);
            return { account, status: 200 };
        }
        const user = await this.userRepository.createOne({
            data: {
                firstName: payload.given_name,
                lastName: payload.family_name,
                email: payload.email,
                profileImage: payload.picture,
                provider: enums_1.ProviderEnum.GOOGLE,
                confirmEmail: new Date(),
            },
        });
        return {
            status: 201,
            Credential: await this.tokens.createLoginCredentials(user, issuer),
        };
    }
    async forgotPassword({ email }) {
        const user = await this.userRepository.findOne({
            filter: {
                email,
                provider: enums_1.ProviderEnum.SYSTEM,
            },
        });
        if (!user) {
            throw new exception_1.NotFoundExeption("User not found");
        }
        await this.redis.sendEmailOtp({
            email,
            subject: enums_1.EmailEnum.RESET_PASSWORD,
            title: "Reset Password",
        });
        return { message: "Reset password OTP sent successfully" };
    }
    async resetPassword({ email, otp, password }) {
        const hashOtp = await this.redis.get(this.redis.otpKey({ email, type: enums_1.EmailEnum.RESET_PASSWORD }));
        if (!hashOtp) {
            throw new exception_1.NotFoundExeption("OTP expired or invalid");
        }
        const user = (await this.userRepository.findOne({
            filter: {
                email,
                provider: enums_1.ProviderEnum.SYSTEM,
            },
        }));
        if (!user) {
            throw new exception_1.NotFoundExeption("User not found");
        }
        const isValidOtp = await (0, hash_security_1.compareHash)({
            plaintext: otp,
            ciphertext: hashOtp,
        });
        if (!isValidOtp) {
            throw new exception_1.ConflictExeption("Invalid OTP");
        }
        user.password = password;
        await user.save();
        await this.redis.deleteKey(this.redis.otpKey({ email, type: enums_1.EmailEnum.RESET_PASSWORD }));
        return { message: "Password reset successfully" };
    }
    async findUserByEmail(email) {
        const user = await this.userRepository.findOne({
            filter: { email },
            projection: { email: 1 },
        });
        return user ? this.normalizeUser(user) : null;
    }
    async createUser(data) {
        const securedData = await this.secureUserData(data);
        const user = await this.userRepository.createOne({ data: securedData });
        if (!user)
            throw new exception_1.BadRequestExaption("User creation failed");
        return this.normalizeUser(user);
    }
    async secureUserData(data) {
        const { username, confirmPassword: _confirmPassword, FCM: _FCM, ...userData } = data;
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
    async deleteUsers(filter, options) {
        return this.userRepository.deleteMany({ filter });
    }
    normalizeUser(user) {
        return user?.toJSON?.() ?? user;
    }
}
exports.AuthenticationService = AuthenticationService;
exports.default = new AuthenticationService();
