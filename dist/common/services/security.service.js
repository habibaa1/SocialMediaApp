"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityService = void 0;
const security_1 = require("../utils/security");
class SecurityService {
    constructor() {
    }
    generateHash = security_1.generateHash;
    compareHash = security_1.compareHash;
    generateEncryption = security_1.generateEncryption;
    generateDecryption = security_1.generateDecryption;
}
exports.SecurityService = SecurityService;
