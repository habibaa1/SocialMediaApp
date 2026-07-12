"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileFilter = exports.fileFieldValidation = void 0;
exports.fileFieldValidation = {
    image: ['image/jpeg', 'image/jpg', 'image/png'],
    video: ['video/mp4']
};
const fileFilter = (validation) => {
    return function (req, file, cb) {
        console.log(file.mimetype);
        if (!validation.includes(file.mimetype)) {
            return cb(new Error("Invalid file format", { cause: { status: 400 } }));
        }
        return cb(null, true);
    };
};
exports.fileFilter = fileFilter;
