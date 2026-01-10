const express = require('express');
const router = express.Router();
const omrController = require('../controllers/omrController');
const jwt = require('jsonwebtoken');

// Middleware to extract user from token
const authenticate = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Unauthorized' });

    jwt.verify(token, process.env.JWT_SECRET || 'lms-secret-key-123', (err, user) => {
        if (err) return res.status(403).json({ message: 'Forbidden' });
        req.user = user;
        next();
    });
};

// Process OMR image
// router.post('/process', authenticate, omrController.processOMR);
router.post('/process', omrController.processOMR); // Auth disabled for testing connectivity

// Check OMR service health
router.get('/health', omrController.checkOMRService);

module.exports = router;
