module.exports = (req, res, next) => {
    const userAgent = req.headers['user-agent'] || '';
    const sebHeader = req.headers['x-safe-exam-browser'];

    // 1. Check for SEB in User-Agent
    if (userAgent.includes('SEB')) {
        return next();
    }

    // 2. Check for custom X-Safe-Exam-Browser header
    if (sebHeader) {
        return next();
    }

    // 3. Bypass for Admins (for testing purposes)
    if (req.user && req.user.role === 'admin') {
        console.log(`[SEB Bypass] Admin ${req.user.email} bypassed SEB check.`);
        return next();
    }

    // 4. Bypass for Localhost (Demo Mode)
    // Allows testing the Student flow without installing SEB
    if (req.hostname === 'localhost' || req.hostname === '127.0.0.1') {
        console.log(`[SEB Info] Localhost bypass active for ${req.ip}`);
        return next();
    }

    // 5. Block access
    return res.status(403).json({
        message: 'Erişim Engellendi: Bu sınava sadece Safe Exam Browser (SEB) kullanılarak girilebilir.',
        code: 'SEB_REQUIRED'
    });
};
