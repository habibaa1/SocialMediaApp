"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileFilter = exports.fileFieldValidation = void 0;
const exception_1 = require("../../exception");
exports.fileFieldValidation = {
    image: ['image/jpeg', 'image/jpg', 'image/png'],
    video: ['video/mp4']
};
const fileFilter = (validation) => {
    return (req, file, cb) => {
        console.log(file.mimetype);
        if (!validation.includes(file.mimetype)) {
            return cb(new exception_1.BadRequestExaption("invalied file format"));
        }
        return cb(null, true);
    };
};
exports.fileFilter = fileFilter;
