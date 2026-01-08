// Push Notification Backend Routes
const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');

// Initialize Firebase Admin (in production, use service account)
// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount)
// });

// In-memory device storage (use database in production)
const devices = [];

/**
 * Register device for push notifications
 */
router.post('/register-device', async (req, res) => {
    try {
        const { userId, fcmToken, platform } = req.body;

        if (!fcmToken) {
            return res.status(400).json({ error: 'FCM token required' });
        }

        // Check if device already registered
        const existing = devices.find(d => d.fcmToken === fcmToken);

        if (!existing) {
            devices.push({
                id: Date.now(),
                userId: userId || req.user?.id,
                fcmToken,
                platform: platform || 'unknown',
                registeredAt: new Date().toISOString()
            });
        }

        res.json({
            success: true,
            message: 'Device registered for notifications'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Send notification to specific user
 */
router.post('/send', async (req, res) => {
    try {
        const { userId, title, body, data } = req.body;

        // Get user's devices
        const userDevices = devices.filter(d => d.userId === userId);

        if (userDevices.length === 0) {
            return res.status(404).json({ error: 'No devices found for user' });
        }

        const tokens = userDevices.map(d => d.fcmToken);

        // Send multicast message (Firebase Admin SDK)
        // const message = {
        //     notification: { title, body },
        //     data: data || {},
        //     tokens: tokens
        // };
        // const response = await admin.messaging().sendMulticast(message);

        // Simulated response
        const response = {
            successCount: tokens.length,
            failureCount: 0
        };

        res.json({
            success: true,
            sent: response.successCount,
            failed: response.failureCount
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Send notification to topic (broadcast)
 */
router.post('/send-to-topic', async (req, res) => {
    try {
        const { topic, title, body, data } = req.body;

        // const message = {
        //     notification: { title, body },
        //     data: data || {},
        //     topic: topic
        // };
        // await admin.messaging().send(message);

        res.json({
            success: true,
            message: `Notification sent to topic: ${topic}`
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Send exam reminder notifications
 */
router.post('/exam-reminder', async (req, res) => {
    try {
        const { examId, examName, examDate } = req.body;

        // Get enrolled students (would query database in production)
        const enrolledUserIds = [1, 2, 3]; // Mock

        for (const userId of enrolledUserIds) {
            const userDevices = devices.filter(d => d.userId === userId);

            if (userDevices.length > 0) {
                // Send notification (simulated)
                console.log(`Sending exam reminder to user ${userId}: ${examName}`);
            }
        }

        res.json({
            success: true,
            message: 'Exam reminders sent',
            count: enrolledUserIds.length
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get registered devices for a user
 */
router.get('/devices/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const userDevices = devices.filter(d => d.userId == userId);

        res.json({
            success: true,
            count: userDevices.length,
            devices: userDevices
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Unregister device
 */
router.delete('/device/:fcmToken', async (req, res) => {
    try {
        const { fcmToken } = req.params;
        const index = devices.findIndex(d => d.fcmToken === fcmToken);

        if (index > -1) {
            devices.splice(index, 1);
            res.json({ success: true, message: 'Device unregistered' });
        } else {
            res.status(404).json({ error: 'Device not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
