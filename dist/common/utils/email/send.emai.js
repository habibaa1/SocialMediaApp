"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const exception_1 = require("../../exception");
const config_1 = require("../../../config/config");
const sendEmail = async ({ to, cc, bcc, html, subject, attachments = [], }) => {
    if (!to && !cc && !bcc) {
        throw new exception_1.BadRequestExaption("Invalid recipient");
    }
    if (!html?.length && !attachments?.length) {
        throw new exception_1.BadRequestExaption("Invalid mail content");
    }
    const transporter = nodemailer_1.default.createTransport({
        service: 'gmail',
        auth: {
            user: config_1.APP_EMAIL,
            pass: config_1.APP_EMAIL_PASSWORD,
        },
    });
    const info = await transporter.sendMail({
        to,
        cc,
        bcc,
        html,
        subject,
        attachments,
        from: `"${config_1.APPLICATION_NAME} 🌸" <${config_1.APP_EMAIL}>`,
    });
    console.log("Message sent:", info.messageId);
};
exports.sendEmail = sendEmail;
