// 2FA (Two-Factor Authentication) Routes
const express = require('express');
const router = express.Router();
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const { User } = require('../models');

// Generate 2FA secret
router.post('/setup', async (req, res) => {
    try {
        const userId = req.user.id;

        const secret = speakeasy.generateSecret({
            name: `LMS Platform (${req.user.email})`,
            length: 20
        });

        // Store secret temporarily (should be saved after verification)
        await User.update(
            { twoFactorSecret: secret.base32, twoFactorEnabled: false },
            { where: { id: userId } }
        );

        // Generate QR code
        const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

        res.json({
            success: true,
            secret: secret.base32,
            qrCode: qrCodeUrl
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Verify and enable 2FA
router.post('/verify', async (req, res) => {
    try {
        const { token } = req.body;
        const userId = req.user.id;

        const user = await User.findByPk(userId);
        if (!user || !user.twoFactorSecret) {
            return res.status(400).json({ error: '2FA setup not found' });
        }

        const verified = speakeasy.totp.verify({
            secret: user.twoFactorSecret,
            encoding: 'base32',
            token: token,
            window: 2
        });

        if (verified) {
            await User.update(
                { twoFactorEnabled: true },
                { where: { id: userId } }
            );
            res.json({ success: true, message: '2FA başarıyla etkinleştirildi' });
        } else {
            res.status(400).json({ error: 'Geçersiz doğrulama kodu' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Validate 2FA code during login
router.post('/validate', async (req, res) => {
    try {
        const { email, token } = req.body;

        const user = await User.findOne({ where: { email } });
        if (!user || !user.twoFactorEnabled) {
            return res.status(400).json({ error: '2FA not enabled' });
        }

        const verified = speakeasy.totp.verify({
            secret: user.twoFactorSecret,
            encoding: 'base32',
            token: token,
            window: 2
        });

        if (verified) {
            res.json({ success: true, message: '2FA doğrulandı' });
        } else {
            res.status(400).json({ error: 'Geçersiz doğrulama kodu' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Disable 2FA
router.post('/disable', async (req, res) => {
    try {
        const { token } = req.body;
        const userId = req.user.id;

        const user = await User.findByPk(userId);

        const verified = speakeasy.totp.verify({
            secret: user.twoFactorSecret,
            encoding: 'base32',
            token: token,
            window: 2
        });

        if (verified) {
            await User.update(
                { twoFactorEnabled: false, twoFactorSecret: null },
                { where: { id: userId } }
            );
            res.json({ success: true, message: '2FA devre dışı bırakıldı' });
        } else {
            res.status(400).json({ error: 'Geçersiz doğrulama kodu' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
