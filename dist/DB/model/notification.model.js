"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationModel = void 0;
const mongoose_1 = require("mongoose");
const enums_1 = require("../../common/enums");
const notificationSchema = new mongoose_1.Schema({
    title: { type: String, required: true },
    senderId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    recipientId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        default: null,
    },
    audience: {
        type: String,
        enum: Object.values(enums_1.NotificationAudienceEnum),
        default: enums_1.NotificationAudienceEnum.USER,
    },
    type: {
        type: String,
        enum: Object.values(enums_1.NotificationTypeEnum),
        required: true,
    },
    relatedEntityId: {
        type: mongoose_1.Schema.Types.ObjectId,
        default: null,
    },
    relatedEntityType: {
        type: String,
        enum: ["POST", "COMMENT", "REPLY", "STORY", "USER"],
        default: null,
    },
    message: { type: String },
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    readAt: { type: Date, default: null },
    deletedAt: { type: Date, default: null },
}, {
    timestamps: true,
});
exports.NotificationModel = mongoose_1.models.Notification ||
    (0, mongoose_1.model)("Notification", notificationSchema);
