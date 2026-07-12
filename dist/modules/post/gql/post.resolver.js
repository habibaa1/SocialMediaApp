"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.postResolver = exports.PostResolver = void 0;
const validation_1 = require("../../../common/validation");
const middleware_1 = require("../../../middleware");
const post_service_1 = require("../post.service");
const post_validation_1 = require("../post.validation");
class PostResolver {
    postService;
    constructor() {
        this.postService = new post_service_1.PostService();
    }
    postlist = async (parent, args, context) => {
        await (0, middleware_1.GQLValidation)(validation_1.paginationValidationSchema.query, args);
        if (!context.user) {
            throw new Error("Unauthorized");
        }
        const data = await this.postService.postList(args, context.user);
        return {
            message: "Done",
            data,
        };
    };
    reactOnPost = async (parent, { postID, react }, { user }) => {
        await (0, middleware_1.GQLValidation)(post_validation_1.reactOnPostGQL, { postID, react });
        const data = await this.postService.reactPost({ postID, react }, user);
        return {
            message: "Done",
            data,
        };
    };
}
exports.PostResolver = PostResolver;
exports.postResolver = new PostResolver();
