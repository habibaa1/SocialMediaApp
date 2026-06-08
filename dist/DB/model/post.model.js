"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostModel = void 0;
const mongoose_1 = require("mongoose");
const enums_1 = require("../../common/enums");
const postSchema = new mongoose_1.Schema({
    folderId: { type: String, required: true },
    content: {
        type: String,
        required: function () {
            return !this.attachments?.length;
        }
    },
    attachments: { type: [String] },
    availability: { type: Number, enum: enums_1.AvailabilityEnum, default: enums_1.AvailabilityEnum.PUBLIC },
    likes: [{ type: mongoose_1.Types.ObjectId, ref: "User" }],
    tags: [{ type: mongoose_1.Types.ObjectId, ref: "User" }],
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
    collection: "SOCIAL_APP_POSTS"
});
postSchema.virtual('comments', {
    localField: "_id",
    foreignField: "postId",
    ref: "Comment",
    justOne: true,
});
postSchema.pre(["findOne", "find", "countDocuments"], function () {
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
postSchema.pre(["updateOne", "findOneAndUpdate"], function () {
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
postSchema.pre(["deleteOne", "findOneAndDelete"], function () {
    const query = this.getQuery();
    if (query.force === true) {
        this.setQuery({ ...query });
    }
    else {
        this.setQuery({ deletedAt: { $exists: true }, ...query });
    }
});
exports.PostModel = mongoose_1.models.Post || (0, mongoose_1.model)("Post", postSchema);
exports.PostModel.syncIndexes();
