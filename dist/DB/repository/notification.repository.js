"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationRepository = void 0;
const notification_model_1 = require("../model/notification.model");
const base_reposatory_1 = require("./base.reposatory");
class NotificationRepository extends base_reposatory_1.BaseRepository {
    constructor() {
        super(notification_model_1.NotificationModel);
    }
}
exports.NotificationRepository = NotificationRepository;
