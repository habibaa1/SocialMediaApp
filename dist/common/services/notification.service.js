"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationService = exports.NotificationService = void 0;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const firebaseServiceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
    "./src/config/socialmediaapp-ff7d0-firebase-adminsdk-fbsvc-a5876a7554.json";
const serviceAccountPath = (0, node_path_1.resolve)(process.cwd(), firebaseServiceAccountPath);
const serviceAccount = (0, node_fs_1.existsSync)(serviceAccountPath)
    ? JSON.parse((0, node_fs_1.readFileSync)(serviceAccountPath, "utf8"))
    : undefined;
const firebaseApp = firebase_admin_1.default.apps.length
    ? firebase_admin_1.default.app()
    : firebase_admin_1.default.initializeApp(serviceAccount
        ? { credential: firebase_admin_1.default.credential.cert(serviceAccount) }
        : undefined);
class NotificationService {
    messaging;
    constructor() {
        this.messaging = firebaseApp.messaging();
    }
    async sendNotification(token, title, body) {
        await this.messaging.send({
            notification: { title, body },
            token,
        });
    }
    async sendNotifications({ tokens, data, }) {
        await Promise.allSettled(tokens.map((token) => this.sendNotification(token, data.title, data.body)));
    }
}
exports.NotificationService = NotificationService;
exports.notificationService = new NotificationService();
