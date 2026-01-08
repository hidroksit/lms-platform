const express = require('express');
const router = express.Router();
const examController = require('../controllers/examController');
const jwt = require('jsonwebtoken');

const sebMiddleware = require('../middleware/sebMiddleware');

// Middleware to extract user from token for submission
const authenticate = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Unauthorized' });

    jwt.verify(token, process.env.JWT_SECRET || 'lms-secret-key-123', (err, user) => {
        if (err) return res.status(403).json({ message: 'Forbidden' });
        req.user = user;
        next();
    });
};

router.post('/', authenticate, examController.createExam);
router.get('/', authenticate, examController.getAllExams);
// SEB required to view specific exam details (to prevent questions leaking)
router.get('/:id', authenticate, examController.getExamById);
// SEB required to submit exam
router.post('/submit', authenticate, sebMiddleware, examController.submitExam);

// SEB Config Export
router.get('/:examId/seb-config', require('../controllers/sebController').getSEBConfig);

module.exports = router;
