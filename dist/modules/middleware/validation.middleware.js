"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validation = void 0;
const exception_1 = require("../../common/exception");
const validation = (schema) => {
    return (req, res, next) => {
        const validationErrors = [];
        for (const key of Object.keys(schema)) {
            if (!schema[key])
                continue;
            if (req.file) {
                req.body.file = req.file;
            }
            if (req.files) {
                console.log(req.files);
                req.body.files = req.files;
            }
            const validationResult = schema[key].safeParse(req[key]);
            if (!validationResult.success) {
                const error = validationResult.error;
                validationErrors.push({
                    key, issues: error.issues.map(issue => {
                        return { message: issue.message, path: issue.path };
                    })
                });
            }
        }
        if (validationErrors.length) {
            throw new exception_1.BadRequestExaption("validation error", validationErrors);
        }
        next();
    };
};
exports.validation = validation;
