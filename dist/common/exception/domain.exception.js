"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ForbiddenExeption = exports.UnauthorizedExeption = exports.NotFoundExeption = exports.ConflictExeption = exports.BadRequestExaption = void 0;
const application_exception_1 = require("./application.exception");
class BadRequestExaption extends application_exception_1.ApplicationExaption {
    constructor(message = "BadRequest ", cause) {
        super(message, 400, cause);
    }
}
exports.BadRequestExaption = BadRequestExaption;
class ConflictExeption extends application_exception_1.ApplicationExaption {
    constructor(message = 'conflict', cause) {
        super(message, 409, cause);
    }
}
exports.ConflictExeption = ConflictExeption;
class NotFoundExeption extends application_exception_1.ApplicationExaption {
    constructor(message = 'NotFound', cause) {
        super(message, 404, cause);
    }
}
exports.NotFoundExeption = NotFoundExeption;
class UnauthorizedExeption extends application_exception_1.ApplicationExaption {
    constructor(message = 'Unauthorize', cause) {
        super(message, 401, cause);
    }
}
exports.UnauthorizedExeption = UnauthorizedExeption;
class ForbiddenExeption extends application_exception_1.ApplicationExaption {
    constructor(message = 'Forbidden', cause) {
        super(message, 403, cause);
    }
}
exports.ForbiddenExeption = ForbiddenExeption;
