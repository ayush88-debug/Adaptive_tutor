import nodemailer from "nodemailer";
import { apiError } from "../utils/apiError.js";

const sendEmail = async ({ to, subject, html }) => {
    try {
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: true, // true for port 465
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        await transporter.sendMail({
            from: `"Auth System" <${process.env.SMTP_USER}>`,
            to,
            subject,
            html,
        });
        
    } catch (error) {
        throw new apiError(500, `Email sending failed: ${error.message}`);
    }
};

export default sendEmail;
