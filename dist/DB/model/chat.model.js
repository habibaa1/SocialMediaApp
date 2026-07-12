"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatModel = void 0;
const mongoose_1 = require("mongoose");
const enums_1 = require("../../common/enums");
const messageSchema = new mongoose_1.Schema({
    content: {
        type: String, required: function () {
            return !this.attachments?.length;
        }
    },
    attachments: { type: [String] },
    likes: [{ type: mongoose_1.Types.ObjectId, ref: "User" }],
    tags: [{ type: mongoose_1.Types.ObjectId, ref: "User" }],
    createdBy: { type: mongoose_1.Types.ObjectId, ref: "User", required: true },
    createdAt: { type: Date, default: Date.now },
    deletedAt: { type: Date },
    restoredAt: { type: Date },
    updatedAt: { type: Date }
});
const chatSchema = new mongoose_1.Schema({
    participants: [{ type: mongoose_1.Types.ObjectId, ref: "User" }],
    createdBy: { type: mongoose_1.Types.ObjectId, ref: "User", required: true },
    messages: { type: [messageSchema], required: true },
    type: { type: String, enum: enums_1.ChatEnum, required: true },
    group: { type: String },
    group_image: { type: String },
    roomId: { type: String },
    createdAt: { type: Date, default: Date.now },
    deletedAt: { type: Date },
    restoredAt: { type: Date },
    updatedAt: { type: Date }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    strict: true,
    strictQuery: true,
    collection: "SOCIAL_APP_CHATS"
});
chatSchema.pre(["find", "findOne", "findOneAndUpdate"], function () {
    if (!this.getFilter) {
        return;
    }
    const filter = this.getFilter();
    if (filter?.deletedAt === undefined) {
        this.setQuery({ ...filter, deletedAt: null });
    }
});
chatSchema.pre("updateOne", function () {
    if (!this.getFilter) {
        return;
    }
    const filter = this.getFilter();
    if (filter?.deletedAt === undefined) {
        this.setQuery({ ...filter, deletedAt: null });
    }
});
chatSchema.pre("findOneAndUpdate", function () {
    if (!this.getFilter) {
        return;
    }
    const filter = this.getFilter();
    if (filter?.deletedAt === undefined) {
        this.setQuery({ ...filter, deletedAt: null });
    }
});
exports.chatModel = mongoose_1.models.chat || (0, mongoose_1.model)("chat", chatSchema);
