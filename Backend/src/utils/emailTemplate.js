const getEmailTemplate = (username, verificationCode) => {
    return `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
            <h2 style="color: #4CAF50; text-align: center;">Email Verification</h2>
            <p>Hello <strong>${username}</strong>,</p>
            <p>Thank you for registering with us! Please use the following code to verify your email address:</p>
            <div style="text-align: center; margin: 20px 0;">
                <span style="font-size: 24px; font-weight: bold; color: #333; letter-spacing: 3px;">${verificationCode}</span>
            </div>
            <p style="color: #555;">⚠ This code is valid for <strong>5 hours</strong>. If you did not request this, please ignore this email.</p>
            <hr/>
            <p style="font-size: 12px; color: #999; text-align: center;">&copy; ${new Date().getFullYear()} APPNAME. All rights reserved.</p>
        </div>
    `;
}

export default getEmailTemplate;
