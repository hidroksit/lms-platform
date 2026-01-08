// Proctoring Routes - Webcam Recording, Identity Verification, Face Detection
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

// Configure storage for webcam recordings
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/proctoring/'),
    filename: (req, file, cb) => {
        const examId = req.params.examId || 'unknown';
        const userId = req.user?.id || 'anonymous';
        cb(null, `proctor_${examId}_${userId}_${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({ storage, limits: { fileSize: 100 * 1024 * 1024 } }); // 100MB

// In-memory storage (use database in production)
const proctoringSessions = [];
const violations = [];

/**
 * Start proctoring session
 */
router.post('/session/start', async (req, res) => {
    try {
        const { examId, userId, webcamEnabled, screenEnabled } = req.body;

        const session = {
            id: Date.now().toString(),
            examId,
            userId,
            webcamEnabled: webcamEnabled || false,
            screenEnabled: screenEnabled || false,
            startedAt: new Date().toISOString(),
            endedAt: null,
            status: 'active',
            recordings: [],
            violations: [],
            identityVerified: false
        };

        proctoringSessions.push(session);

        res.json({
            success: true,
            sessionId: session.id,
            message: 'Proctoring session started'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Upload webcam recording chunk
 */
router.post('/session/:sessionId/recording', upload.single('video'), async (req, res) => {
    try {
        const { sessionId } = req.params;
        const session = proctoringSessions.find(s => s.id === sessionId);

        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        if (req.file) {
            session.recordings.push({
                filename: req.file.filename,
                path: req.file.path,
                size: req.file.size,
                uploadedAt: new Date().toISOString()
            });
        }

        res.json({ success: true, message: 'Recording chunk uploaded' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Identity verification with photo
 */
router.post('/session/:sessionId/verify-identity', upload.single('idPhoto'), async (req, res) => {
    try {
        const { sessionId } = req.params;
        const session = proctoringSessions.find(s => s.id === sessionId);

        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        // In production: Use face recognition API to compare
        // For now, mark as verified if photo uploaded
        session.identityVerified = !!req.file;
        session.identityPhoto = req.file?.filename;

        res.json({
            success: true,
            verified: session.identityVerified,
            message: 'Identity verification completed'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Report violation (face detection, multiple faces, tab switch, etc.)
 */
router.post('/session/:sessionId/violation', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { type, description, timestamp, screenshot } = req.body;

        const session = proctoringSessions.find(s => s.id === sessionId);

        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        const violation = {
            id: Date.now().toString(),
            sessionId,
            type, // 'no_face', 'multiple_faces', 'tab_switch', 'copy_paste', 'right_click', 'screen_capture'
            description,
            timestamp: timestamp || new Date().toISOString(),
            screenshot: screenshot || null,
            severity: getSeverity(type)
        };

        session.violations.push(violation);
        violations.push(violation);

        res.json({
            success: true,
            violationId: violation.id,
            totalViolations: session.violations.length
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Face detection status update
 */
router.post('/session/:sessionId/face-status', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { faceDetected, faceCount, confidence } = req.body;

        const session = proctoringSessions.find(s => s.id === sessionId);

        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        // Log face detection event
        if (!session.faceHistory) session.faceHistory = [];
        session.faceHistory.push({
            timestamp: new Date().toISOString(),
            faceDetected,
            faceCount,
            confidence
        });

        // Auto-create violation if multiple faces
        if (faceCount > 1) {
            session.violations.push({
                id: Date.now().toString(),
                type: 'multiple_faces',
                description: `${faceCount} faces detected`,
                timestamp: new Date().toISOString(),
                severity: 'high'
            });
        }

        // Auto-create violation if no face for too long
        if (!faceDetected) {
            const noFaceViolations = session.violations.filter(v => v.type === 'no_face').length;
            if (noFaceViolations % 5 === 0) { // Every 5th missing face
                session.violations.push({
                    id: Date.now().toString(),
                    type: 'no_face',
                    description: 'Face not detected',
                    timestamp: new Date().toISOString(),
                    severity: 'medium'
                });
            }
        }

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * End proctoring session
 */
router.post('/session/:sessionId/end', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const session = proctoringSessions.find(s => s.id === sessionId);

        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        session.endedAt = new Date().toISOString();
        session.status = 'completed';

        // Calculate trust score
        const trustScore = calculateTrustScore(session);
        session.trustScore = trustScore;

        res.json({
            success: true,
            session: {
                id: session.id,
                duration: getDuration(session.startedAt, session.endedAt),
                totalViolations: session.violations.length,
                trustScore,
                identityVerified: session.identityVerified
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get proctoring report for an exam
 */
router.get('/report/:examId', async (req, res) => {
    try {
        const { examId } = req.params;
        const examSessions = proctoringSessions.filter(s => s.examId === examId);

        const report = {
            examId,
            totalSessions: examSessions.length,
            activeSessions: examSessions.filter(s => s.status === 'active').length,
            completedSessions: examSessions.filter(s => s.status === 'completed').length,
            averageTrustScore: calculateAverageTrust(examSessions),
            violations: {
                total: examSessions.reduce((sum, s) => sum + s.violations.length, 0),
                byType: groupViolationsByType(examSessions)
            },
            sessions: examSessions.map(s => ({
                id: s.id,
                userId: s.userId,
                status: s.status,
                trustScore: s.trustScore,
                violations: s.violations.length,
                identityVerified: s.identityVerified
            }))
        };

        res.json({ success: true, report });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Live monitoring - get active sessions
 */
router.get('/live/:examId', async (req, res) => {
    try {
        const { examId } = req.params;
        const activeSessions = proctoringSessions.filter(
            s => s.examId === examId && s.status === 'active'
        );

        res.json({
            success: true,
            count: activeSessions.length,
            sessions: activeSessions.map(s => ({
                id: s.id,
                userId: s.userId,
                startedAt: s.startedAt,
                violations: s.violations.length,
                lastFaceStatus: s.faceHistory?.[s.faceHistory.length - 1] || null
            }))
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Helper functions
function getSeverity(type) {
    const severities = {
        'no_face': 'medium',
        'multiple_faces': 'high',
        'tab_switch': 'medium',
        'copy_paste': 'high',
        'right_click': 'low',
        'screen_capture': 'high'
    };
    return severities[type] || 'low';
}

function calculateTrustScore(session) {
    let score = 100;

    // Deduct for violations
    for (const v of session.violations) {
        if (v.severity === 'high') score -= 15;
        else if (v.severity === 'medium') score -= 10;
        else score -= 5;
    }

    // Bonus for identity verification
    if (session.identityVerified) score += 5;

    return Math.max(0, Math.min(100, score));
}

function calculateAverageTrust(sessions) {
    const completed = sessions.filter(s => s.trustScore !== undefined);
    if (completed.length === 0) return 0;
    return Math.round(completed.reduce((sum, s) => sum + s.trustScore, 0) / completed.length);
}

function groupViolationsByType(sessions) {
    const groups = {};
    for (const s of sessions) {
        for (const v of s.violations) {
            groups[v.type] = (groups[v.type] || 0) + 1;
        }
    }
    return groups;
}

function getDuration(start, end) {
    const ms = new Date(end) - new Date(start);
    const minutes = Math.floor(ms / 60000);
    return `${minutes} dakika`;
}

module.exports = router;
