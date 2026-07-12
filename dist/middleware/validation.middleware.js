"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.socketValidation = exports.GQLValidation = exports.validation = void 0;
const exception_1 = require("../common/exception");
const validation = (schema) => {
    return (req, res, next) => {
        console.log(Object.keys(schema));
        const issues = [];
        for (const key of Object.keys(schema)) {
            if (!schema[key])
                continue;
            const validationResult = schema[key].safeParse(req[key]);
            if (!validationResult.success) {
                const error = validationResult.error;
                issues.push({
                    key,
                    issues: error.issues.map((issue) => {
                        return { message: issue.message, path: issue.path };
                    }),
                });
            }
        }
        if (issues.length) {
            throw new exception_1.BadRequestExaption("Validation Error", { issues });
        }
        next();
    };
};
exports.validation = validation;
const GQLValidation = async (schema, args) => {
    const validationResult = schema.safeParse(args);
    if (!validationResult.success) {
        throw (0, exception_1.MapGraphQLError)(new exception_1.BadRequestExaption("Validation Error", {
            issues: validationResult.error.issues.map((issue) => {
                return {
                    path: issue.path,
                    message: issue.message,
                };
            }),
        }));
    }
    return true;
};
exports.GQLValidation = GQLValidation;
const socketValidation = async (schema, args) => {
    const validationResult = schema.safeParse(args);
    if (!validationResult.success) {
        throw new exception_1.BadRequestExaption("Validation Error", {
            issues: validationResult.error.issues.map((issue) => {
                return {
                    path: issue.path,
                    message: issue.message,
                };
            }),
        });
    }
    return true;
};
exports.socketValidation = socketValidation;
