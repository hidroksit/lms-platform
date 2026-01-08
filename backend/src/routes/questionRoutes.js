const express = require('express');
const router = express.Router();
const { Question } = require('../models');
const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Unauthorized' });

    jwt.verify(token, process.env.JWT_SECRET || 'lms-secret-key-123', (err, user) => {
        if (err) return res.status(403).json({ message: 'Forbidden' });
        req.user = user;
        next();
    });
};

// Get all questions for question bank
router.get('/bank', authenticate, async (req, res) => {
    try {
        const questions = await Question.findAll({
            attributes: ['id', 'text', 'type', 'correctAnswer'],
            order: [['id', 'DESC']],
            limit: 100
        });

        // Add mock difficulty/category for demo
        const enriched = questions.map(q => ({
            ...q.toJSON(),
            difficulty: ['easy', 'medium', 'hard'][Math.floor(Math.random() * 3)],
            category: 'Genel'
        }));

        res.json(enriched);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create new question
router.post('/', authenticate, async (req, res) => {
    try {
        const question = await Question.create(req.body);
        res.status(201).json(question);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
