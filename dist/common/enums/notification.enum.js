"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationAudienceEnum = exports.NotificationTypeEnum = void 0;
var NotificationTypeEnum;
(function (NotificationTypeEnum) {
    NotificationTypeEnum["LIKE"] = "LIKE";
    NotificationTypeEnum["COMMENT"] = "COMMENT";
    NotificationTypeEnum["REPLY"] = "REPLY";
    NotificationTypeEnum["POST"] = "POST";
    NotificationTypeEnum["MESSAGE"] = "MESSAGE";
    NotificationTypeEnum["FOLLOW"] = "FOLLOW";
    NotificationTypeEnum["SHARE"] = "SHARE";
    NotificationTypeEnum["SYSTEM"] = "SYSTEM";
})(NotificationTypeEnum || (exports.NotificationTypeEnum = NotificationTypeEnum = {}));
var NotificationAudienceEnum;
(function (NotificationAudienceEnum) {
    NotificationAudienceEnum["USER"] = "USER";
    NotificationAudienceEnum["ALL"] = "ALL";
})(NotificationAudienceEnum || (exports.NotificationAudienceEnum = NotificationAudienceEnum = {}));
