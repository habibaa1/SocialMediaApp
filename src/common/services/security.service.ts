import {  compareHash, generateDecryption, generateEncryption, generateHash } from "../utils/security";
export class SecurityService {
    constructor() {

    }
    generateHash = generateHash
    compareHash = compareHash
    generateEncryption = generateEncryption
    generateDecryption = generateDecryption
}