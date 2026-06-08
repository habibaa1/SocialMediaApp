"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalErroHandler = void 0;
const globalErroHandler = (error, req, res, next) => {
    return res.status(500).json({
        message: error.message || "internal server error",
        cause: error.cause,
        stack: error.stack,
        error
    });
};
exports.globalErroHandler = globalErroHandler;
