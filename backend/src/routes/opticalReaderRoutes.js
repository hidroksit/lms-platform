// Optical Reader Backend Routes
const express = require('express');
const router = express.Router();

// In-memory storage for demo (use database in production)
const scannedResults = [];

/**
 * Submit scanned optical form results
 */
router.post('/submit', async (req, res) => {
    try {
        const { formId, studentId, answers, totalQuestions, timestamp, imageUri } = req.body;

        if (!formId || !answers || !Array.isArray(answers)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid request data'
            });
        }

        // Validate answers format
        for (const answer of answers) {
            if (!answer.questionNumber || !answer.selectedOption || answer.confidence === undefined) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid answer format'
                });
            }
        }

        // Create scan record
        const scanRecord = {
            id: Date.now(),
            formId,
            studentId: studentId || 'UNKNOWN',
            answers,
            totalQuestions: totalQuestions || answers.length,
            timestamp: timestamp || new Date().toISOString(),
            imageUri,
            processedAt: new Date().toISOString(),
            status: 'pending_review'
        };

        scannedResults.push(scanRecord);

        // Auto-grade if exam exists
        const examId = formId.split('_')[1]; // Extract exam ID from form ID
        let score = null;

        if (examId) {
            const { Exam, Question } = require('../models');
            const exam = await Exam.findOne({
                where: { id: examId },
                include: [{ model: Question }]
            });

            if (exam && exam.Questions) {
                let correctCount = 0;

                answers.forEach(answer => {
                    const question = exam.Questions.find(q => q.id === answer.questionNumber);
                    if (question && question.correctOption === answer.selectedOption) {
                        correctCount++;
                    }
                });

                score = (correctCount / exam.Questions.length) * 100;
                scanRecord.score = score;
                scanRecord.correctCount = correctCount;
                scanRecord.status = 'graded';
            }
        }

        res.json({
            success: true,
            message: 'Scan result submitted successfully',
            scanId: scanRecord.id,
            score: score,
            data: scanRecord
        });

    } catch (error) {
        console.error('Optical reader submission error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Get all scanned results
 */
router.get('/results', async (req, res) => {
    try {
        const { studentId, formId, status } = req.query;

        let results = scannedResults;

        // Filter by student
        if (studentId) {
            results = results.filter(r => r.studentId === studentId);
        }

        // Filter by form
        if (formId) {
            results = results.filter(r => r.formId === formId);
        }

        // Filter by status
        if (status) {
            results = results.filter(r => r.status === status);
        }

        res.json({
            success: true,
            count: results.length,
            results: results
        });

    } catch (error) {
        console.error('Get results error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Get single scan result
 */
router.get('/results/:id', async (req, res) => {
    try {
        const scanId = parseInt(req.params.id);
        const result = scannedResults.find(r => r.id === scanId);

        if (!result) {
            return res.status(404).json({
                success: false,
                error: 'Scan result not found'
            });
        }

        res.json({
            success: true,
            result: result
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Update scan result (for manual review)
 */
router.patch('/results/:id', async (req, res) => {
    try {
        const scanId = parseInt(req.params.id);
        const { answers, status } = req.body;

        const resultIndex = scannedResults.findIndex(r => r.id === scanId);

        if (resultIndex === -1) {
            return res.status(404).json({
                success: false,
                error: 'Scan result not found'
            });
        }

        // Update answers if provided
        if (answers) {
            scannedResults[resultIndex].answers = answers;
        }

        // Update status if provided
        if (status) {
            scannedResults[resultIndex].status = status;
        }

        scannedResults[resultIndex].updatedAt = new Date().toISOString();

        res.json({
            success: true,
            message: 'Scan result updated',
            result: scannedResults[resultIndex]
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Get scan statistics
 */
router.get('/stats', async (req, res) => {
    try {
        const stats = {
            totalScans: scannedResults.length,
            pending: scannedResults.filter(r => r.status === 'pending_review').length,
            graded: scannedResults.filter(r => r.status === 'graded').length,
            averageConfidence: 0,
            lowConfidenceScans: 0
        };

        if (scannedResults.length > 0) {
            let totalConfidence = 0;
            let confidenceCount = 0;

            scannedResults.forEach(scan => {
                scan.answers.forEach(answer => {
                    totalConfidence += answer.confidence;
                    confidenceCount++;

                    if (answer.confidence < 0.80) {
                        stats.lowConfidenceScans++;
                    }
                });
            });

            stats.averageConfidence = confidenceCount > 0
                ? (totalConfidence / confidenceCount).toFixed(2)
                : 0;
        }

        res.json({
            success: true,
            stats: stats
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
