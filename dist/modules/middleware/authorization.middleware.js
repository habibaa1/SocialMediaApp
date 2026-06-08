"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorization = void 0;
const exception_1 = require("../../common/exception");
const authorization = (accessRoles) => {
    return (req, res, next) => {
        if (!accessRoles.includes(req.user.role)) {
            throw new exception_1.ForbiddenExeption("Not authorized account");
        }
        return next();
    };
};
exports.authorization = authorization;
