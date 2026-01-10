const axios = require('axios');
const { ExamResult } = require('../models');

const OMR_SERVICE_URL = process.env.OMR_SERVICE_URL || 'http://localhost:5000';

exports.processOMR = async (req, res) => {
    try {
        const { image, examId, studentId, answerKey } = req.body;

        if (!image) {
            return res.status(400).json({ message: 'Image is required' });
        }

        // Call Python OMR service
        // Node.js backend communicates with Python service via localhost
        const response = await axios.post(`${OMR_SERVICE_URL}/process`, {
            image: image,
            answer_key: answerKey // Not used by Python anymore but kept for compatibility
        });

        const result = response.data;

        console.log('✅ Python OMR Response:', result);

        // Save result to database if exam and student provided
        if (examId && studentId && result.score) {
            await ExamResult.create({
                examId,
                studentId,
                score: result.score.score,
                answers: JSON.stringify(result.answers),
                submittedAt: new Date()
            });
        }

        res.json({
            success: true,
            answers: result.answers || {},
            detected_answers: result.answers || {} // For backward compatibility
        });

    } catch (error) {
        console.error('OMR Processing Error:', error.message);
        res.status(500).json({
            message: 'OMR processing failed',
            error: error.response?.data?.error || error.message
        });
    }
};

exports.checkOMRService = async (req, res) => {
    try {
        const response = await axios.get(`${OMR_SERVICE_URL}/health`);
        res.json({
            status: 'connected',
            service: response.data
        });
    } catch (error) {
        res.status(503).json({
            status: 'disconnected',
            message: 'OMR service is not available'
        });
    }
};
