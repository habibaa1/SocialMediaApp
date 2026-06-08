"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostRepository = void 0;
const base_reposatory_1 = require("./base.reposatory");
const post_model_1 = require("../model/post.model");
class PostRepository extends base_reposatory_1.BaseRepository {
    constructor() {
        super(post_model_1.PostModel);
    }
}
exports.PostRepository = PostRepository;
