const express = require('express');
const router = express.Router();
const examController = require('../controllers/examController');
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

// Exam routes
router.get('/', authenticate, examController.getAllExams);
router.post('/', authenticate, examController.createExam);
router.get('/:id', authenticate, examController.getExamById);
router.post('/submit', authenticate, examController.submitExam);

// SEB Config Export (optional)
router.get('/:examId/seb-config', require('../controllers/sebController').getSEBConfig);

module.exports = router;
