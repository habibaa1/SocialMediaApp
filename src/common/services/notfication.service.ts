import admin from "firebase-admin";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export class NotificationService {

    private client: admin.app.App

    constructor() {
        var serviceAccount = JSON.parse(readFileSync(resolve('./src/config/online-app-5b41a-firebase-adminsdk-fbsvc-4af5608f28.json') as unknown as string, 'utf8'));
        this.client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        
    }

    async sendNotification({
        token,
        data
    }: {
        token: string,
        data: { title: string, body: string }
    }) {

const message = {
            token,
            data
        };
        return await this.client.messaging().send(message)
    }

    async sendNotifications({
        tokens,
        data
    }: {
        tokens: string[],
        data: { title: string, body: string }
    }) {
        await Promise.allSettled(
            tokens.map(token => {
                return this.sendNotification({ token, data })
            }))
    }
}
export const notificationService = new NotificationService()
