// CSRF Protection Middleware
const crypto = require('crypto');

// CSRF Token Store (use Redis in production)
const csrfTokens = new Map();

/**
 * Generate CSRF Token
 */
const generateToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

/**
 * CSRF Token Generation Middleware
 */
const csrfGenerate = (req, res, next) => {
    const sessionId = req.headers['x-session-id'] || req.cookies?.sessionId || 'anonymous';

    // Generate new token
    const token = generateToken();

    // Store token with expiry (1 hour)
    csrfTokens.set(sessionId, {
        token,
        expires: Date.now() + 3600000
    });

    // Set token in response header and cookie
    res.setHeader('X-CSRF-Token', token);
    res.cookie('csrf-token', token, {
        httpOnly: false, // Accessible by JS for AJAX requests
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 3600000
    });

    next();
};

/**
 * CSRF Token Validation Middleware
 */
const csrfValidate = (req, res, next) => {
    // Skip for GET, HEAD, OPTIONS requests
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
    }

    const sessionId = req.headers['x-session-id'] || req.cookies?.sessionId || 'anonymous';
    const clientToken = req.headers['x-csrf-token'] || req.body?._csrf || req.query?._csrf;

    // Get stored token
    const stored = csrfTokens.get(sessionId);

    if (!stored) {
        return res.status(403).json({
            error: 'CSRF token missing',
            message: 'Please refresh the page and try again'
        });
    }

    // Check expiry
    if (Date.now() > stored.expires) {
        csrfTokens.delete(sessionId);
        return res.status(403).json({
            error: 'CSRF token expired',
            message: 'Please refresh the page and try again'
        });
    }

    // Validate token
    if (!clientToken || clientToken !== stored.token) {
        return res.status(403).json({
            error: 'CSRF token invalid',
            message: 'Security validation failed'
        });
    }

    next();
};

/**
 * Cleanup expired tokens (run periodically)
 */
const cleanupTokens = () => {
    const now = Date.now();
    for (const [key, value] of csrfTokens.entries()) {
        if (now > value.expires) {
            csrfTokens.delete(key);
        }
    }
};

// Run cleanup every 10 minutes
setInterval(cleanupTokens, 600000);

module.exports = { csrfGenerate, csrfValidate };
