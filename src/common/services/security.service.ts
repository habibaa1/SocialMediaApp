import {
  generateDecryption,
  generateEncryption,
  compareHash,
  generateHash,
} from "../utils/security";

export class SecurityService {
  constructor() {}

  generateHash = generateHash;
  compareHash = compareHash;

  generateEncryption = generateEncryption;
  generateDecryption = generateDecryption;
}
