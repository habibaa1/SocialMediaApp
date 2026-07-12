"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StoryModel = void 0;
const mongoose_1 = require("mongoose");
const enums_1 = require("../../common/enums");
const storySchema = new mongoose_1.Schema({
    createdBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    text: { type: String, default: "" },
    attachments: { type: [String], default: [] },
    type: {
        type: String,
        enum: Object.values(enums_1.StoryTypeEnum),
        default: enums_1.StoryTypeEnum.IMAGE,
    },
    expiresAt: {
        type: Date,
        required: true,
        default: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
    deletedAt: { type: Date, default: null },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    strict: true,
    strictQuery: true,
    collection: "SOCIAL_APP_STORIES",
});
storySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
storySchema.pre(["find", "findOne"], function () {
    const filter = this.getFilter();
    if (filter.deletedAt === undefined) {
        this.where({ deletedAt: null, expiresAt: { $gt: new Date() } });
    }
});
storySchema.pre(["updateOne", "updateMany", "findOneAndUpdate"], { document: false, query: true }, function () {
    const filter = this.getFilter();
    if (filter.deletedAt === undefined) {
        this.where({ deletedAt: null, expiresAt: { $gt: new Date() } });
    }
});
exports.StoryModel = mongoose_1.models.Story || (0, mongoose_1.model)("Story", storySchema);
