"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRepository = void 0;
const base_reposatory_1 = require("./base.reposatory");
const user_model_1 = require("../model/user.model");
class UserRepository extends base_reposatory_1.BaseRepository {
    constructor() {
        super(user_model_1.UserModel);
    }
}
exports.UserRepository = UserRepository;
