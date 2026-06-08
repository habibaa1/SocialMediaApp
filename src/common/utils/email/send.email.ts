import nodemailer from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';
import { BadRequestExaption } from '../../exception';
import { APP_EMAIL, APP_EMAIL_PASSWORD, APPLICATION_NAME } from '../../../config/config';

export const sendEmail = async ({
    to,
    cc,
    bcc,
    html,
    subject,
    attachments = [],
}: Mail.Options):Promise<void>=> {
    
    if (!to && !cc && !bcc) {
        throw new BadRequestExaption("Invalid recipient");
    }

    if (!(html as string)?.length && !attachments?.length) {
        throw new BadRequestExaption("Invalid mail content");
    }

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: APP_EMAIL,         
            pass: APP_EMAIL_PASSWORD, 
        },
    });

    const info = await transporter.sendMail({
        to,
        cc,
        bcc,
        html,
        subject,
        attachments,
        from: `"${APPLICATION_NAME} 🌸" <${APP_EMAIL}>`, 
    });

    console.log("Message sent:", info.messageId);
};