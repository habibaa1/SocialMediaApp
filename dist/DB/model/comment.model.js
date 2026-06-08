"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommentModel = void 0;
const mongoose_1 = require("mongoose");
const commentSchema = new mongoose_1.Schema({
    content: {
        type: String,
        required: function () {
            return !this.attachments?.length;
        }
    },
    attachments: { type: [String] },
    likes: [{ type: mongoose_1.Types.ObjectId, ref: "User" }],
    tags: [{ type: mongoose_1.Types.ObjectId, ref: "User" }],
    postId: { type: mongoose_1.Types.ObjectId, ref: "Post", required: true },
    commentId: { type: mongoose_1.Types.ObjectId, ref: "Comment" },
    updatedBy: { type: mongoose_1.Types.ObjectId, ref: "User" },
    createdBy: { type: mongoose_1.Types.ObjectId, ref: "User", required: true },
    deletedAt: { type: Date },
    restoredAt: { type: Date },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    strict: true,
    strictQuery: true,
    collection: "SOCIAL_APP_COMMENTS"
});
commentSchema.virtual('reply', {
    localField: "_id",
    foreignField: "commentId",
    ref: "Comment",
    justOne: true,
});
commentSchema.pre(["findOne", "find", "countDocuments"], function () {
    console.log(this);
    console.log(this.getFilter());
    console.log(this.getQuery());
    const query = this.getQuery();
    if (query.paranoid === false) {
        this.setQuery({ ...query });
    }
    else {
        this.setQuery({ ...query, deletedAt: { $exists: false } });
    }
});
commentSchema.pre(["updateOne", "findOneAndUpdate"], function () {
    const update = this.getUpdate();
    if (update.deletedAt) {
        this.setUpdate({ ...update, $unset: { restoredAt: 1 } });
    }
    if (update.restoredAt) {
        this.setUpdate({ ...update, $unset: { deletedAt: 1 } });
        this.setQuery({ ...this.getQuery(), deletedAt: { $exists: true } });
    }
    console.log(update);
    const query = this.getQuery();
    if (query.paranoid === false) {
        this.setQuery({ ...query });
    }
    else {
        this.setQuery({ deletedAt: { $exists: false }, ...query });
    }
});
commentSchema.pre(["deleteOne", "findOneAndDelete"], function () {
    const query = this.getQuery();
    if (query.force === true) {
        this.setQuery({ ...query });
    }
    else {
        this.setQuery({ deletedAt: { $exists: true }, ...query });
    }
});
exports.CommentModel = mongoose_1.models.Comment || (0, mongoose_1.model)("Comment", commentSchema);
exports.CommentModel.syncIndexes();
