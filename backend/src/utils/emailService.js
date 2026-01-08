const nodemailer = require('nodemailer');

// Create test SMTP transporter (For demo, use Ethereal or configure real SMTP)
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: process.env.SMTP_PORT || 587,
    auth: {
        user: process.env.SMTP_USER || 'demo@lms.com',
        pass: process.env.SMTP_PASS || 'demo123'
    }
});

exports.sendEmail = async (to, subject, html) => {
    try {
        const info = await transporter.sendMail({
            from: '"LMS Platform" <noreply@lms.com>',
            to,
            subject,
            html
        });
        console.log(`[EMAIL] Sent to ${to}: ${info.messageId}`);
        return info;
    } catch (err) {
        console.error(`[EMAIL ERROR] ${err.message}`);
        return null;
    }
};

exports.notifyNewExam = async (studentEmails, examTitle, courseTitle) => {
    const subject = `Yeni Sınav: ${examTitle}`;
    const html = `
        <h2>Yeni Sınav Eklendi</h2>
        <p><strong>Ders:</strong> ${courseTitle}</p>
        <p><strong>Sınav:</strong> ${examTitle}</p>
        <p>Lütfen LMS platformuna giriş yaparak sınava katılın.</p>
    `;

    for (const email of studentEmails) {
        await exports.sendEmail(email, subject, html);
    }
};
