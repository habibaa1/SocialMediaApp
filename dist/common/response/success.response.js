"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.successResponse = void 0;
const successResponse = ({ res, message = "done", status = 200, data }) => {
    return res.status(status).json({
        status: "success",
        message,
        data
    });
};
exports.successResponse = successResponse;
