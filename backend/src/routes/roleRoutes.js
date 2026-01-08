// User Roles Management Routes
const express = require('express');
const router = express.Router();

// Role definitions with permissions
const ROLES = {
    super_admin: {
        id: 'super_admin',
        name: 'Süper Admin',
        description: 'Tüm sistem yönetimi',
        permissions: ['*'], // All permissions
        level: 100
    },
    admin: {
        id: 'admin',
        name: 'Yönetici',
        description: 'Ders yönetimi, raporlar',
        permissions: [
            'courses:manage',
            'users:view',
            'users:edit',
            'exams:manage',
            'reports:view',
            'content:manage'
        ],
        level: 80
    },
    instructor: {
        id: 'instructor',
        name: 'Eğitmen',
        description: 'İçerik oluşturma, not verme',
        permissions: [
            'courses:create',
            'courses:edit',
            'content:create',
            'content:edit',
            'exams:create',
            'exams:grade',
            'students:view',
            'reports:own'
        ],
        level: 60
    },
    assistant: {
        id: 'assistant',
        name: 'Asistan',
        description: 'Sınırlı düzenleme yetkisi',
        permissions: [
            'courses:view',
            'content:edit',
            'exams:grade',
            'students:view'
        ],
        level: 40
    },
    student: {
        id: 'student',
        name: 'Öğrenci',
        description: 'Ders erişimi, sınav girişi',
        permissions: [
            'courses:enroll',
            'courses:view',
            'content:view',
            'exams:take',
            'grades:own'
        ],
        level: 20
    },
    guest: {
        id: 'guest',
        name: 'Misafir',
        description: 'Sınırlı görüntüleme',
        permissions: [
            'courses:preview',
            'content:preview'
        ],
        level: 10
    }
};

// In-memory user-role assignments
const userRoles = new Map();

/**
 * Get all available roles
 */
router.get('/roles', async (req, res) => {
    try {
        const roles = Object.values(ROLES);
        res.json({
            success: true,
            count: roles.length,
            roles
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get single role details
 */
router.get('/roles/:roleId', async (req, res) => {
    try {
        const role = ROLES[req.params.roleId];

        if (!role) {
            return res.status(404).json({ error: 'Role not found' });
        }

        res.json({ success: true, role });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Assign role to user
 */
router.post('/assign', async (req, res) => {
    try {
        const { userId, roleId, courseId } = req.body;

        if (!userId || !roleId) {
            return res.status(400).json({ error: 'userId and roleId required' });
        }

        if (!ROLES[roleId]) {
            return res.status(400).json({ error: 'Invalid role' });
        }

        const key = courseId ? `${userId}:${courseId}` : userId;
        const existing = userRoles.get(key) || [];

        if (!existing.includes(roleId)) {
            existing.push(roleId);
            userRoles.set(key, existing);
        }

        res.json({
            success: true,
            message: `Role "${roleId}" assigned to user ${userId}`,
            userRoles: existing
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Remove role from user
 */
router.delete('/assign', async (req, res) => {
    try {
        const { userId, roleId, courseId } = req.body;

        const key = courseId ? `${userId}:${courseId}` : userId;
        const existing = userRoles.get(key) || [];

        const index = existing.indexOf(roleId);
        if (index > -1) {
            existing.splice(index, 1);
            userRoles.set(key, existing);
        }

        res.json({
            success: true,
            message: `Role "${roleId}" removed from user ${userId}`,
            userRoles: existing
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get user's roles
 */
router.get('/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { courseId } = req.query;

        // Get global roles
        const globalRoles = userRoles.get(userId) || [];

        // Get course-specific roles
        let courseRoles = [];
        if (courseId) {
            courseRoles = userRoles.get(`${userId}:${courseId}`) || [];
        }

        // Merge and get highest level role
        const allRoleIds = [...new Set([...globalRoles, ...courseRoles])];
        const roles = allRoleIds.map(id => ROLES[id]).filter(Boolean);

        // Calculate effective permissions
        const permissions = new Set();
        for (const role of roles) {
            for (const perm of role.permissions) {
                permissions.add(perm);
            }
        }

        res.json({
            success: true,
            userId,
            globalRoles,
            courseRoles,
            effectiveRoles: allRoleIds,
            permissions: [...permissions],
            highestLevel: Math.max(...roles.map(r => r.level), 0)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Check if user has permission
 */
router.get('/check-permission', async (req, res) => {
    try {
        const { userId, permission, courseId } = req.query;

        if (!userId || !permission) {
            return res.status(400).json({ error: 'userId and permission required' });
        }

        // Get user's roles
        const globalRoles = userRoles.get(userId) || [];
        const courseRoles = courseId ? (userRoles.get(`${userId}:${courseId}`) || []) : [];
        const allRoleIds = [...new Set([...globalRoles, ...courseRoles])];

        // Check permissions
        let hasPermission = false;
        for (const roleId of allRoleIds) {
            const role = ROLES[roleId];
            if (role) {
                if (role.permissions.includes('*') || role.permissions.includes(permission)) {
                    hasPermission = true;
                    break;
                }
            }
        }

        res.json({
            success: true,
            permission,
            hasPermission
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Bulk assign roles (e.g., for course enrollment)
 */
router.post('/bulk-assign', async (req, res) => {
    try {
        const { assignments } = req.body;

        if (!Array.isArray(assignments)) {
            return res.status(400).json({ error: 'assignments array required' });
        }

        const results = [];
        for (const { userId, roleId, courseId } of assignments) {
            if (userId && roleId && ROLES[roleId]) {
                const key = courseId ? `${userId}:${courseId}` : userId;
                const existing = userRoles.get(key) || [];
                if (!existing.includes(roleId)) {
                    existing.push(roleId);
                    userRoles.set(key, existing);
                }
                results.push({ userId, roleId, success: true });
            } else {
                results.push({ userId, roleId, success: false, error: 'Invalid data' });
            }
        }

        res.json({
            success: true,
            processed: results.length,
            results
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
