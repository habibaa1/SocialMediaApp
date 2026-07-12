import admin from "firebase-admin";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

// ─── FIREBASE SINGLETON ────────────────────────────────────────────────────────
// initializeApp runs ONCE when this module is first imported.
// Every subsequent import reuses the cached module — initializeApp is never
// called again, so the "app already exists" error cannot occur.

const firebaseServiceAccountPath =
  process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
  "./src/config/socialmediaapp-ff7d0-firebase-adminsdk-fbsvc-a5876a7554.json";
const serviceAccountPath = resolve(process.cwd(), firebaseServiceAccountPath);
const serviceAccount = existsSync(serviceAccountPath)
  ? JSON.parse(readFileSync(serviceAccountPath, "utf8"))
  : undefined;

const firebaseApp = admin.apps.length
  ? admin.app()
  : admin.initializeApp(
      serviceAccount
        ? { credential: admin.credential.cert(serviceAccount) }
        : undefined,
    );

// ──────────────────────────────────────────────────────────────────────────────

export class NotificationService {
  private readonly messaging: admin.messaging.Messaging;

  constructor() {
    // Reuse the singleton app — never call initializeApp here
    this.messaging = firebaseApp.messaging();
  }

  async sendNotification(token: string, title: string, body: string): Promise<void> {
    await this.messaging.send({
      notification: { title, body },
      token,
    });
  }

  async sendNotifications({
    tokens,
    data,
  }: {
    tokens: string[];
    data: { title: string; body: string };
  }): Promise<void> {
    // allSettled so one bad token doesn't cancel the rest
    await Promise.allSettled(
      tokens.map((token) => this.sendNotification(token, data.title, data.body)),
    );
  }
}

export const notificationService = new NotificationService();