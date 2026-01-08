// LTI 1.3 (Learning Tools Interoperability) Routes
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// LTI Platform configuration
const LTI_CONFIG = {
    platformUrl: process.env.LTI_PLATFORM_URL || 'https://lms.example.com',
    clientId: process.env.LTI_CLIENT_ID || 'lms-platform-client',
    deploymentId: process.env.LTI_DEPLOYMENT_ID || 'deployment-1',
    keysetUrl: process.env.LTI_KEYSET_URL || '/api/lti/jwks'
};

// Store for nonces (prevent replay attacks)
const usedNonces = new Set();

/**
 * OIDC Login Initiation
 * Step 1: Tool initiates login
 */
router.get('/login', (req, res) => {
    const {
        iss,
        login_hint,
        target_link_uri,
        lti_message_hint,
        client_id
    } = req.query;

    // Generate state and nonce
    const state = crypto.randomBytes(16).toString('hex');
    const nonce = crypto.randomBytes(16).toString('hex');

    // Store nonce
    usedNonces.add(nonce);

    // Build authorization URL
    const authUrl = new URL(`${iss}/auth`);
    authUrl.searchParams.set('response_type', 'id_token');
    authUrl.searchParams.set('scope', 'openid');
    authUrl.searchParams.set('client_id', client_id || LTI_CONFIG.clientId);
    authUrl.searchParams.set('redirect_uri', `${LTI_CONFIG.platformUrl}/api/lti/launch`);
    authUrl.searchParams.set('login_hint', login_hint);
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('nonce', nonce);
    authUrl.searchParams.set('prompt', 'none');

    if (lti_message_hint) {
        authUrl.searchParams.set('lti_message_hint', lti_message_hint);
    }

    res.redirect(authUrl.toString());
});

/**
 * LTI Launch
 * Step 2: Process ID token and launch tool
 */
router.post('/launch', async (req, res) => {
    try {
        const { id_token, state } = req.body;

        if (!id_token) {
            return res.status(400).json({ error: 'Missing ID token' });
        }

        // Decode token (in production: verify signature with tool's public key)
        const decoded = jwt.decode(id_token);

        // Verify nonce
        if (!decoded.nonce || !usedNonces.has(decoded.nonce)) {
            return res.status(400).json({ error: 'Invalid nonce' });
        }

        // Remove used nonce
        usedNonces.delete(decoded.nonce);

        // Validate LTI claims
        if (decoded['https://purl.imsglobal.org/spec/lti/claim/message_type'] !== 'LtiResourceLinkRequest') {
            return res.status(400).json({ error: 'Invalid message type' });
        }

        // Extract user info
        const userId = decoded.sub;
        const userName = decoded.name || 'Unknown';
        const userEmail = decoded.email;
        const role = decoded['https://purl.imsglobal.org/spec/lti/claim/roles']?.[0];

        // Extract resource link
        const resourceLink = decoded['https://purl.imsglobal.org/spec/lti/claim/resource_link'];

        // Launch tool/resource
        res.json({
            success: true,
            message: 'LTI launch successful',
            user: { userId, userName, userEmail, role },
            resourceLink: resourceLink,
            launchUrl: resourceLink?.url || '/dashboard'
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * JSON Web Key Set (JWKS)
 * Public key endpoint for tools to verify our signatures
 */
router.get('/jwks', (req, res) => {
    // In production: serve actual public keys
    const jwks = {
        keys: [
            {
                kty: 'RSA',
                e: 'AQAB',
                use: 'sig',
                kid: 'lms-platform-key-1',
                alg: 'RS256',
                n: 'mock-public-key-modulus'
            }
        ]
    };

    res.json(jwks);
});

/**
 * Deep Linking
 * Allow tools to return content items
 */
router.post('/deep-link', async (req, res) => {
    try {
        const { content_items, data } = req.body;

        // Process content items (videos, assignments, etc.)
        const items = Array.isArray(content_items) ? content_items : [content_items];

        // Store in course content
        for (const item of items) {
            console.log('Adding content item:', item);
            // Would save to database in production
        }

        res.json({
            success: true,
            message: `${items.length} content item(s) added`
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Names and Roles Provisioning Service (NRPS)
 * Allow tools to get roster information
 */
router.get('/nrps', async (req, res) => {
    try {
        const { context_id } = req.query;

        // Mock roster data (would query database in production)
        const members = [
            {
                status: 'Active',
                name: 'John Doe',
                email: 'john@example.com',
                user_id: '123',
                roles: ['http://purl.imsglobal.org/vocab/lis/v2/membership#Learner']
            },
            {
                status: 'Active',
                name: 'Jane Smith',
                email: 'jane@example.com',
                user_id: '124',
                roles: ['http://purl.imsglobal.org/vocab/lis/v2/membership#Instructor']
            }
        ];

        res.json({
            id: context_id,
            context: {
                id: context_id,
                label: 'Course 101',
                title: 'Introduction to Computer Science'
            },
            members: members
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Assignment and Grade Services (AGS)
 * Allow tools to create line items and submit grades
 */
router.post('/ags/lineitem', async (req, res) => {
    try {
        const { label, scoreMaximum, resourceId } = req.body;

        const lineItem = {
            id: `lineitem-${Date.now()}`,
            label,
            scoreMaximum,
            resourceId,
            tag: 'grade'
        };

        res.json(lineItem);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/ags/scores', async (req, res) => {
    try {
        const { userId, scoreGiven, scoreMaximum, comment } = req.body;

        console.log(`Grade submitted: ${scoreGiven}/${scoreMaximum} for user ${userId}`);

        res.json({
            success: true,
            message: 'Grade submitted'
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
