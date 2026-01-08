// Email Notification Service using Nodemailer
const nodemailer = require('nodemailer');

class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: process.env.SMTP_PORT || 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER || 'your-email@gmail.com',
                pass: process.env.SMTP_PASS || 'your-app-password'
            }
        });
    }

    /**
     * Send course enrollment notification
     */
    async sendCourseEnrollment(userEmail, userName, courseName) {
        const mailOptions = {
            from: `"LMS Platform" <${process.env.SMTP_USER}>`,
            to: userEmail,
            subject: `✅ ${courseName} Dersine Kayıt Oldunuz`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2196F3;">Merhaba ${userName}!</h2>
                    <p>Başarıyla <strong>${courseName}</strong> dersine kayıt oldunuz.</p>
                    <p>Dersi dashboard'dan görüntüleyebilirsiniz.</p>
                    <a href="${process.env.APP_URL}/dashboard" 
                       style="display: inline-block; padding: 12px 24px; background: #2196F3; color: white; text-decoration: none; border-radius: 4px; margin-top: 16px;">
                        Dashboard'a Git
                    </a>
                    <hr style="margin-top: 32px; border: none; border-top: 1px solid #eee;">
                    <p style="color: #666; font-size: 12px;">Bu bir otomatik e-postadır, lütfen yanıtlamayın.</p>
                </div>
            `
        };

        return await this.sendMail(mailOptions);
    }

    /**
     * Send exam reminder notification
     */
    async sendExamReminder(userEmail, userName, examName, examDate) {
        const mailOptions = {
            from: `"LMS Platform" <${process.env.SMTP_USER}>`,
            to: userEmail,
            subject: `⏰ Sınav Hatırlatma: ${examName}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #ff9800;">Merhaba ${userName}!</h2>
                    <p><strong>${examName}</strong> sınavınız yaklaşıyor.</p>
                    <p style="font-size: 18px; color: #ff5722;">
                        📅 Tarih: ${new Date(examDate).toLocaleString('tr-TR')}
                    </p>
                    <p>Sınava hazır olduğunuzdan emin olun!</p>
                    <a href="${process.env.APP_URL}/dashboard" 
                       style="display: inline-block; padding: 12px 24px; background: #ff9800; color: white; text-decoration: none; border-radius: 4px; margin-top: 16px;">
                        Sınava Git
                    </a>
                </div>
            `
        };

        return await this.sendMail(mailOptions);
    }

    /**
     * Send grade published notification
     */
    async sendGradePublished(userEmail, userName, examName, score) {
        const mailOptions = {
            from: `"LMS Platform" <${process.env.SMTP_USER}>`,
            to: userEmail,
            subject: `📊 Notunuz Açıklandı: ${examName}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #4caf50;">Merhaba ${userName}!</h2>
                    <p><strong>${examName}</strong> için notunuz açıklandı.</p>
                    <div style="text-align: center; margin: 32px 0;">
                        <div style="display: inline-block; padding: 24px 48px; background: ${score >= 50 ? '#4caf50' : '#f44336'}; color: white; border-radius: 8px; font-size: 32px; font-weight: bold;">
                            ${score}
                        </div>
                    </div>
                    <p style="text-align: center;">
                        ${score >= 50 ? '🎉 Tebrikler! Geçtiniz.' : '😔 Üzgünüz, kaldınız.'}
                    </p>
                    <a href="${process.env.APP_URL}/dashboard/grades" 
                       style="display: inline-block; padding: 12px 24px; background: #2196F3; color: white; text-decoration: none; border-radius: 4px; margin-top: 16px;">
                        Notlarımı Görüntüle
                    </a>
                </div>
            `
        };

        return await this.sendMail(mailOptions);
    }

    /**
     * Send assignment deadline reminder
     */
    async sendAssignmentDeadline(userEmail, userName, assignmentName, deadline) {
        const daysLeft = Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24));

        const mailOptions = {
            from: `"LMS Platform" <${process.env.SMTP_USER}>`,
            to: userEmail,
            subject: `⏳ Ödev Son Tarihi Yaklaşıyor: ${assignmentName}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #ff5722;">Merhaba ${userName}!</h2>
                    <p><strong>${assignmentName}</strong> ödevinin son teslim tarihi yaklaşıyor.</p>
                    <p style="font-size: 24px; color: #ff5722; text-align: center; margin: 24px 0;">
                        ⏰ ${daysLeft} gün kaldı!
                    </p>
                    <p style="color: #666;">Son Tarih: ${new Date(deadline).toLocaleString('tr-TR')}</p>
                    <a href="${process.env.APP_URL}/dashboard" 
                       style="display: inline-block; padding: 12px 24px; background: #ff5722; color: white; text-decoration: none; border-radius: 4px; margin-top: 16px;">
                        Ödevi Teslim Et
                    </a>
                </div>
            `
        };

        return await this.sendMail(mailOptions);
    }

    /**
     * Send welcome email
     */
    async sendWelcomeEmail(userEmail, userName) {
        const mailOptions = {
            from: `"LMS Platform" <${process.env.SMTP_USER}>`,
            to: userEmail,
            subject: '🎓 LMS Platform\'a Hoş Geldiniz!',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h1 style="color: #2196F3;">Hoş Geldiniz ${userName}!</h1>
                    <p>LMS Platform hesabınız başarıyla oluşturuldu.</p>
                    <h3>Neler Yapabilirsiniz:</h3>
                    <ul>
                        <li>📚 Derslere kayıt olun</li>
                        <li>📝 Sınavlara girin</li>
                        <li>📊 Notlarınızı takip edin</li>
                        <li>💬 Eğitmenlerle iletişim kurun</li>
                    </ul>
                    <a href="${process.env.APP_URL}/login" 
                       style="display: inline-block; padding: 12px 24px; background: #4caf50; color: white; text-decoration: none; border-radius: 4px; margin-top: 16px;">
                        Giriş Yap
                    </a>
                </div>
            `
        };

        return await this.sendMail(mailOptions);
    }

    /**
     * Generic send mail function
     */
    async sendMail(mailOptions) {
        try {
            const info = await this.transporter.sendMail(mailOptions);
            console.log('Email sent:', info.messageId);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error('Email error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Verify SMTP configuration
     */
    async verifyConnection() {
        try {
            await this.transporter.verify();
            console.log('SMTP server ready');
            return true;
        } catch (error) {
            console.error('SMTP verification failed:', error);
            return false;
        }
    }
}

module.exports = new EmailService();
