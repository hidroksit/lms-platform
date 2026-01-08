// Access Control Routes - Web Content Access Management
const express = require('express');
const router = express.Router();
const { Course, CourseAccess, User } = require('../models');

/**
 * Set access control for a course
 */
router.post('/courses/:courseId/access', async (req, res) => {
    try {
        const { courseId } = req.params;
        const {
            startDate,
            endDate,
            allowedGroups,
            password,
            prerequisiteCourseIds,
            maxEnrollments
        } = req.body;

        const course = await Course.findByPk(courseId);
        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }

        // Create or update access control
        const accessControl = await CourseAccess.findOne({ where: { courseId } }) ||
            await CourseAccess.create({ courseId });

        await accessControl.update({
            startDate: startDate || null,
            endDate: endDate || null,
            allowedGroups: allowedGroups ? JSON.stringify(allowedGroups) : null,
            password: password || null,
            prerequisiteCourseIds: prerequisiteCourseIds ? JSON.stringify(prerequisiteCourseIds) : null,
            maxEnrollments: maxEnrollments || null
        });

        res.json({
            success: true,
            message: 'Access control updated',
            accessControl
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Check if user has access to course
 */
router.get('/courses/:courseId/check-access', async (req, res) => {
    try {
        const { courseId } = req.params;
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const course = await Course.findByPk(courseId);
        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }

        const accessControl = await CourseAccess.findOne({ where: { courseId } });

        // No restrictions
        if (!accessControl) {
            return res.json({ hasAccess: true, reason: 'No restrictions' });
        }

        const now = new Date();
        const reasons = [];

        // Date restrictions
        if (accessControl.startDate && new Date(accessControl.startDate) > now) {
            reasons.push(`Course starts on ${accessControl.startDate}`);
        }
        if (accessControl.endDate && new Date(accessControl.endDate) < now) {
            reasons.push(`Course ended on ${accessControl.endDate}`);
        }

        // Group restrictions
        if (accessControl.allowedGroups) {
            const allowedGroups = JSON.parse(accessControl.allowedGroups);
            const user = await User.findByPk(userId);

            if (!allowedGroups.includes(user.group)) {
                reasons.push('User group not allowed');
            }
        }

        // Prerequisites
        if (accessControl.prerequisiteCourseIds) {
            const prerequisites = JSON.parse(accessControl.prerequisiteCourseIds);
            // Check if user completed prerequisites
            // (simplified - would check enrollments/completions in production)
            for (const prereqId of prerequisites) {
                const prereq = await Course.findByPk(prereqId);
                if (!prereq) continue;
                reasons.push(`Must complete: ${prereq.title}`);
            }
        }

        // Max enrollments
        if (accessControl.maxEnrollments) {
            const enrollmentCount = await course.countEnrollments();
            if (enrollmentCount >= accessControl.maxEnrollments) {
                reasons.push('Course is full');
            }
        }

        const hasAccess = reasons.length === 0;

        res.json({
            hasAccess,
            reasons: hasAccess ? [] : reasons,
            accessControl: {
                startDate: accessControl.startDate,
                endDate: accessControl.endDate,
                hasPassword: !!accessControl.password,
                maxEnrollments: accessControl.maxEnrollments
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Verify course password
 */
router.post('/courses/:courseId/verify-password', async (req, res) => {
    try {
        const { courseId } = req.params;
        const { password } = req.body;

        const accessControl = await CourseAccess.findOne({ where: { courseId } });

        if (!accessControl || !accessControl.password) {
            return res.json({ valid: true, message: 'No password required' });
        }

        const valid = accessControl.password === password;

        res.json({
            valid,
            message: valid ? 'Password correct' : 'Invalid password'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get access statistics for a course
 */
router.get('/courses/:courseId/access-stats', async (req, res) => {
    try {
        const { courseId } = req.params;

        const accessControl = await CourseAccess.findOne({ where: { courseId } });
        const course = await Course.findByPk(courseId);

        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }

        const enrollmentCount = await course.countEnrollments?.() || 0;

        res.json({
            success: true,
            stats: {
                hasRestrictions: !!accessControl,
                currentEnrollments: enrollmentCount,
                maxEnrollments: accessControl?.maxEnrollments || null,
                spotsRemaining: accessControl?.maxEnrollments
                    ? accessControl.maxEnrollments - enrollmentCount
                    : null,
                isActive: accessControl
                    ? (!accessControl.startDate || new Date(accessControl.startDate) <= new Date()) &&
                    (!accessControl.endDate || new Date(accessControl.endDate) >= new Date())
                    : true
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
