"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalErrorHandler = void 0;
const globalErrorHandler = (err, req, res, next) => {
    console.error(err.stack);
    const status = err.statusCode || 500;
    const response = { message: err.message || "Internal Server Error" };
    if (err.cause) {
        response.details = err.cause;
    }
    res.status(status).json(response);
};
exports.globalErrorHandler = globalErrorHandler;
