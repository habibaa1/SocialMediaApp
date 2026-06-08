"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userResolver = exports.UserResolver = void 0;
const user_service_1 = require("../user.service");
class UserResolver {
    userService;
    constructor() {
        this.userService = new user_service_1.UserService();
    }
    profile = async (parent, args) => {
        const data = await this.userService.profile({});
        return { message: `Hello`, data };
    };
}
exports.UserResolver = UserResolver;
exports.userResolver = new UserResolver();
