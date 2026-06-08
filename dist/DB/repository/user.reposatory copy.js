"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRepository = void 0;
const base_reposatory_1 = require("./base.reposatory");
class UserRepository extends base_reposatory_1.BaseRepository {
    constructor(model) {
        super(model);
    }
}
exports.UserRepository = UserRepository;
