"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GQLAuthorization = exports.authorization = void 0;
const exception_1 = require("../common/exception");
const authorization = (accessRoles) => {
    return async (req, res, next) => {
        if (!req.user) {
            throw new exception_1.ForbiddenExeption("Unauthorized");
        }
        if (!accessRoles.includes(req.user.role)) {
            throw new exception_1.ForbiddenExeption("Not allowed account");
        }
        next();
    };
};
exports.authorization = authorization;
const GQLAuthorization = async (accessRoles, user) => {
    if (!accessRoles.includes(user.role)) {
        throw (0, exception_1.MapGraphQLError)(new exception_1.ForbiddenExeption("Not authorized account"));
    }
    return true;
};
exports.GQLAuthorization = GQLAuthorization;
