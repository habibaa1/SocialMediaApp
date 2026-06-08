"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authentication = void 0;
const exception_1 = require("../../common/exception");
const services_1 = require("../../common/services");
const enums_1 = require("../../common/enums");
const authentication = (tokenType = enums_1.TokenTypeEnum.ACCESS) => {
    return async (req, res, next) => {
        const tokenService = new services_1.TokenService();
        const [key, credential] = req.headers?.authorization?.split(" ") || [];
        console.log({ key, credential });
        if (!key || !credential) {
            throw new exception_1.UnauthorizedExeption('Missing authorization');
        }
        switch (key) {
            case 'Basic':
                break;
            default:
                const { decoded, user } = await tokenService.decodeToken({ token: credential, tokenType });
                req.user = user;
                req.decoded = decoded;
                break;
        }
        next();
    };
};
exports.authentication = authentication;
