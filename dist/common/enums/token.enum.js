"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogOutEnum = exports.TokenTypeEnum = void 0;
var TokenTypeEnum;
(function (TokenTypeEnum) {
    TokenTypeEnum[TokenTypeEnum["ACCESS"] = 0] = "ACCESS";
    TokenTypeEnum[TokenTypeEnum["REFRESH"] = 1] = "REFRESH";
})(TokenTypeEnum || (exports.TokenTypeEnum = TokenTypeEnum = {}));
var LogOutEnum;
(function (LogOutEnum) {
    LogOutEnum[LogOutEnum["ONLY"] = 0] = "ONLY";
    LogOutEnum[LogOutEnum["ALL"] = 1] = "ALL";
})(LogOutEnum || (exports.LogOutEnum = LogOutEnum = {}));
