const rateLimit = require('express-rate-limit');

// Rate Limiter: Max 100 requests per 15 minutes per IP
exports.apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again later.'
});

// Audit Logging Middleware
exports.auditLog = (req, res, next) => {
    // Log critical operations: login, create/delete course/exam, grade submission
    const criticalPaths = ['/api/auth/login', '/api/courses', '/api/exams'];
    const isCritical = criticalPaths.some(path => req.path.includes(path));

    if (isCritical && ['POST', 'DELETE', 'PUT'].includes(req.method)) {
        console.log(`[AUDIT] ${new Date().toISOString()} | ${req.method} ${req.path} | User: ${req.user?.email || 'Anonymous'} | IP: ${req.ip}`);
    }

    next();
};
