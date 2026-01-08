// OAuth 2.0 Routes - Google & Microsoft Login
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'lms-secret-key-123';

// Google OAuth callback simulation
router.post('/google', async (req, res) => {
    try {
        const { credential, clientId } = req.body;

        // In production, verify the credential with Google's API
        // For demo, we simulate the response

        // Decode Google JWT (in production, verify signature)
        const decoded = JSON.parse(Buffer.from(credential.split('.')[1], 'base64').toString());

        const { email, name, picture, sub: googleId } = decoded;

        // Find or create user
        let user = await User.findOne({ where: { email } });

        if (!user) {
            user = await User.create({
                email,
                name,
                password: '', // OAuth users don't need password
                role: 'student',
                oauthProvider: 'google',
                oauthId: googleId,
                avatar: picture
            });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role, name: user.name },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            token,
            user: { id: user.id, email: user.email, name: user.name, role: user.role }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Microsoft OAuth callback simulation
router.post('/microsoft', async (req, res) => {
    try {
        const { accessToken } = req.body;

        // In production, use accessToken to fetch user info from Microsoft Graph API
        // For demo, we simulate the response

        const mockUserInfo = {
            mail: 'user@outlook.com',
            displayName: 'Microsoft User',
            id: 'ms-user-id-123'
        };

        let user = await User.findOne({ where: { email: mockUserInfo.mail } });

        if (!user) {
            user = await User.create({
                email: mockUserInfo.mail,
                name: mockUserInfo.displayName,
                password: '',
                role: 'student',
                oauthProvider: 'microsoft',
                oauthId: mockUserInfo.id
            });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role, name: user.name },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            token,
            user: { id: user.id, email: user.email, name: user.name, role: user.role }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get OAuth configuration (client IDs for frontend)
router.get('/config', (req, res) => {
    res.json({
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID || 'demo-google-client-id',
            enabled: true
        },
        microsoft: {
            clientId: process.env.MICROSOFT_CLIENT_ID || 'demo-microsoft-client-id',
            tenantId: process.env.MICROSOFT_TENANT_ID || 'common',
            enabled: true
        }
    });
});

module.exports = router;
