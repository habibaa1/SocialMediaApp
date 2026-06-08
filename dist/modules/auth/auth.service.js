"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthnticationService = void 0;
const exception_1 = require("../../common/exception");
const user_reposatory_1 = require("../../DB/repository/user.reposatory");
const security_1 = require("../../common/utils/security");
const email_1 = require("../../common/utils/email");
const services_1 = require("../../common/services");
const enums_1 = require("../../common/enums");
const otp_1 = require("../../common/utils/otp");
const google_auth_library_1 = require("google-auth-library");
const config_1 = require("../../config/config");
const notfication_service_1 = require("../../common/services/notfication.service");
class AuthnticationService {
    userRepository;
    redis;
    tokenService;
    notificationService;
    constructor() {
        this.userRepository = new user_reposatory_1.UserRepository();
        this.tokenService = new services_1.TokenService();
        this.redis = services_1.redisService;
        this.notificationService = notfication_service_1.notificationService;
    }
    async login({ email, password, FCM }, issuer) {
        const user = await this.userRepository.findOne({
            filter: {
                email,
                provider: enums_1.ProviderEnum.SYSTEM,
                confirmEmail: { $exists: true }
            },
        });
        if (!user) {
            throw new exception_1.NotFoundExeption("invalid login credentials");
        }
        if (!await (0, security_1.compareHash)({ plaintext: password, ciphertext: user.password })) {
            throw new exception_1.NotFoundExeption("invaled login credentials");
        }
        if (FCM) {
            await this.redis.addFCM(user._id, FCM);
            const tokens = await this.redis.getFCMs(user._id);
            if (tokens?.length) {
                await this.notificationService.sendNotifications({
                    tokens,
                    data: {
                        title: "Login Notification",
                        body: `You have logged in successfully at ${new Date()}`
                    }
                });
            }
        }
        return await this.tokenService.createLoginCredentials(user, issuer);
    }
    async sendEmailOtp({ email, subject, title }) {
        const isBlockedTTL = await this.redis.ttl(this.redis.blockOtpKey({ email, subject }));
        if (isBlockedTTL > 0) {
            throw new exception_1.BadRequestExaption(`sorry we cannot request new otp while are blocked please try again after ${isBlockedTTL}`);
        }
        const remainingOtpTTL = await this.redis.ttl(this.redis.otpKey({ email, subject }));
        if (remainingOtpTTL > 0) {
            throw new exception_1.BadRequestExaption(`sorry we cannot request new otp while are blocked please try again after ${remainingOtpTTL}`);
        }
        const maxtrial = await this.redis.get(this.redis.maxAttemptOtpKey({ email, subject }));
        if (maxtrial >= 3) {
            await this.redis.set({
                key: this.redis.blockOtpKey({ email, subject }),
                value: 1,
                ttl: 7 * 60
            });
            throw new exception_1.BadRequestExaption(`you have reached the max trial`);
        }
        const code = (0, otp_1.createRandomOtp)();
        await this.redis.set({
            key: this.redis.otpKey({ email, subject }),
            value: await (0, security_1.generateHash)({ plaintext: `${code}` }),
            ttl: 120
        });
        email_1.emailEvent.emit("sendEmail", async () => {
            await (0, email_1.sendEmail)({
                to: email,
                subject,
                html: (0, email_1.emailTemplate)({ code, title })
            });
            await this.redis.incr(this.redis.maxAttemptOtpKey({ email, subject }));
        });
    }
    async signup({ email, username, password, phone }) {
        const checkUserExist = await this.userRepository.findOne({
            filter: { email },
            projection: "email",
            options: { lean: false }
        });
        console.log({ checkUserExist });
        if (checkUserExist) {
            throw new exception_1.ConflictExeption("email already exist");
        }
        const user = await this.userRepository.createOne({
            data: {
                email,
                username,
                password,
                phone: phone
            }
        });
        if (!user) {
            throw new exception_1.BadRequestExaption("failed to create user");
        }
        this.sendEmailOtp({ email, subject: enums_1.EmailEnum.Confirm_Email, title: "verify Email" });
        return user.toJSON();
    }
    async confirmEmail({ email, otp }) {
        const hashOtp = await this.redis.get(this.redis.otpKey({ email, subject: enums_1.EmailEnum.Confirm_Email }));
        if (!hashOtp) {
            throw new exception_1.NotFoundExeption("Expired otp");
        }
        const account = await this.userRepository.findOne({
            filter: { email, confirmEmail: { $exists: false }, provider: enums_1.ProviderEnum.SYSTEM }
        });
        if (!account) {
            throw new exception_1.NotFoundExeption("Fail to find matching account");
        }
        if (!await (0, security_1.compareHash)({ plaintext: otp, ciphertext: hashOtp })) {
            throw new exception_1.ConflictExeption("Invalid otp");
        }
        account.confirmEmail = new Date();
        await account.save();
        await this.redis.deleteKey(await this.redis.Keys(this.redis.otpKey({ email })));
        return;
    }
    ;
    async resendConfirmEmail({ email }) {
        const account = await this.userRepository.findOne({
            filter: { email, confirmEmail: { $exists: false }, provider: enums_1.ProviderEnum.SYSTEM }
        });
        if (!account) {
            throw new exception_1.NotFoundExeption("Fail to find matching account");
        }
        await this.sendEmailOtp({ email, subject: enums_1.EmailEnum.Confirm_Email, title: "Verify Email" });
        return;
    }
    ;
    async verifyGoogleAccount(idToken) {
        const client = new google_auth_library_1.OAuth2Client();
        const ticket = await client.verifyIdToken({
            idToken,
            audience: config_1.CLIENT_IDS,
        });
        const payload = ticket.getPayload();
        if (!payload?.email_verified) {
            throw new exception_1.BadRequestExaption("Invalid token payload");
        }
        return payload;
    }
    ;
    async loginWithGmail(idToken, issuer) {
        const payload = await this.verifyGoogleAccount(idToken);
        const user = await this.userRepository.findOne({
            filter: {
                email: payload.email,
                provider: enums_1.ProviderEnum.GOOGLE
            }
        });
        if (!user) {
            throw new exception_1.NotFoundExeption("Invalid account provider or not register account");
        }
        return await this.tokenService.createLoginCredentials(user, issuer);
    }
    ;
    async signupWithGmail(idToken, issuer) {
        const payload = await this.verifyGoogleAccount(idToken);
        const checkExist = await this.userRepository.findOne({
            filter: {
                email: payload.email
            }
        });
        console.log({ checkExist });
        if (checkExist) {
            if (checkExist.provider !== enums_1.ProviderEnum.GOOGLE) {
                throw new exception_1.ConflictExeption("Invalid account provider");
            }
            return { status: 200, credentials: await this.loginWithGmail(idToken, issuer) };
        }
        const account = await this.userRepository.createOne({
            data: {
                firstName: payload.given_name,
                lastName: payload.family_name,
                email: payload.email,
                profileImage: payload.picture,
                confirmEmail: new Date(),
                provider: enums_1.ProviderEnum.GOOGLE
            }
        });
        return { status: 201, credentials: await this.tokenService.createLoginCredentials(account, issuer) };
    }
    ;
    async requestForgotPasswordOtp(inputs) {
        const { email } = inputs;
        const account = await this.userRepository.findOne({
            filter: {
                email,
                confirmEmail: { $exists: true },
                provider: enums_1.ProviderEnum.SYSTEM
            }
        });
        if (!account) {
            throw new exception_1.NotFoundExeption("Fail to find matching account");
        }
        await this.sendEmailOtp({
            email,
            subject: enums_1.EmailEnum.Forgot_Password,
            title: "Reset Code"
        });
    }
    async verifyForgotPasswordOtp({ email, otp }) {
        const hashOtp = await this.redis.get(this.redis.otpKey({ email, subject: enums_1.EmailEnum.Forgot_Password }));
        if (!hashOtp) {
            throw new exception_1.NotFoundExeption("Expired or invalid otp");
        }
        if (!await (0, security_1.compareHash)({ plaintext: otp, ciphertext: hashOtp })) {
            throw new exception_1.ConflictExeption("Invalid otp");
        }
    }
    async resetForgotPasswordOtp(inputs) {
        const { email, otp, password } = inputs;
        const hashOtp = await this.redis.get(this.redis.otpKey({ email, subject: enums_1.EmailEnum.Forgot_Password }));
        if (!hashOtp || !await (0, security_1.compareHash)({ plaintext: otp, ciphertext: hashOtp })) {
            throw new exception_1.ConflictExeption("Invalid or expired otp process");
        }
        const hashedPassword = await (0, security_1.generateHash)({ plaintext: password });
        const account = await this.userRepository.findOneAndUpdate({
            filter: { email, provider: enums_1.ProviderEnum.SYSTEM },
            update: { password: hashedPassword },
            options: {}
        });
        if (!account) {
            throw new exception_1.NotFoundExeption("Fail to update password");
        }
        await this.redis.deleteKey(this.redis.otpKey({ email, subject: enums_1.EmailEnum.Forgot_Password }));
    }
}
exports.AuthnticationService = AuthnticationService;
exports.default = new AuthnticationService();
