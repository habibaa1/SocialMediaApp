"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userResolver = exports.UserResolver = void 0;
const user_service_1 = require("../user.service");
const exception_1 = require("../../../common/exception");
class UserResolver {
    userService;
    constructor() {
        this.userService = new user_service_1.UserService();
    }
    profile = async (parent, args) => {
        if (!args.search) {
            throw new exception_1.BadRequestExaption("User ID is required");
        }
        const data = await this.userService.profile(args.search);
        return { message: `Hello`, data };
    };
}
exports.UserResolver = UserResolver;
exports.userResolver = new UserResolver();
