"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommentRepository = void 0;
const base_reposatory_1 = require("./base.reposatory");
const model_1 = require("../model");
class CommentRepository extends base_reposatory_1.BaseRepository {
    constructor() {
        super(model_1.CommentModel);
    }
}
exports.CommentRepository = CommentRepository;
