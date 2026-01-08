// H5P Interactive Content Routes
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

// Configure multer for H5P package uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/h5p/');
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/zip' || path.extname(file.originalname) === '.h5p') {
            cb(null, true);
        } else {
            cb(new Error('Only .h5p files are allowed'));
        }
    }
});

// In-memory H5P content storage (use database in production)
const h5pContents = [];

/**
 * Upload H5P content package
 */
router.post('/upload', upload.single('h5pFile'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const { title, courseId } = req.body;

        // In production: Extract H5P package, validate, store in library
        const h5pContent = {
            id: Date.now(),
            title: title || req.file.originalname,
            filename: req.file.filename,
            filepath: req.file.path,
            size: req.file.size,
            courseId: courseId || null,
            uploadedAt: new Date().toISOString(),
            uploadedBy: req.user?.id || 'unknown',
            type: 'h5p',
            metadata: {
                mainLibrary: 'H5P.InteractiveVideo', // Would extract from h5p.json
                preloadedDependencies: []
            }
        };

        h5pContents.push(h5pContent);

        res.json({
            success: true,
            message: 'H5P content uploaded successfully',
            content: h5pContent
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get all H5P content
 */
router.get('/content', async (req, res) => {
    try {
        const { courseId } = req.query;

        let contents = h5pContents;

        if (courseId) {
            contents = contents.filter(c => c.courseId == courseId);
        }

        res.json({
            success: true,
            count: contents.length,
            contents: contents
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get single H5P content
 */
router.get('/content/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const content = h5pContents.find(c => c.id == id);

        if (!content) {
            return res.status(404).json({ error: 'H5P content not found' });
        }

        res.json({
            success: true,
            content: content
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Embed H5P content (returns HTML)
 */
router.get('/embed/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const content = h5pContents.find(c => c.id == id);

        if (!content) {
            return res.status(404).json({ error: 'H5P content not found' });
        }

        // In production: Generate H5P player HTML with actual content
        const embedHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>${content.title}</title>
                <link rel="stylesheet" href="/h5p/core/styles/h5p.css">
                <script src="/h5p/core/js/h5p.js"></script>
            </head>
            <body>
                <div class="h5p-iframe-wrapper">
                    <iframe 
                        id="h5p-iframe-${id}" 
                        class="h5p-iframe" 
                        data-content-id="${id}" 
                        style="width: 100%; height: 600px; border: none;"
                        src="/api/h5p/player/${id}"
                        allowfullscreen>
                    </iframe>
                </div>
                <script>
                    // H5P integration code
                    console.log('H5P content loaded: ${content.title}');
                </script>
            </body>
            </html>
        `;

        res.send(embedHtml);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * H5P Player endpoint
 */
router.get('/player/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const content = h5pContents.find(c => c.id == id);

        if (!content) {
            return res.status(404).json({ error: 'H5P content not found' });
        }

        // Mock H5P player HTML
        const playerHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>${content.title}</title>
                <style>
                    body {
                        margin: 0;
                        padding: 20px;
                        font-family: Arial, sans-serif;
                        background: #f5f5f5;
                    }
                    .h5p-container {
                        max-width: 900px;
                        margin: 0 auto;
                        background: white;
                        padding: 40px;
                        border-radius: 8px;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    }
                    .h5p-placeholder {
                        text-align: center;
                        padding: 60px 20px;
                        background: #e3f2fd;
                        border-radius: 8px;
                    }
                </style>
            </head>
            <body>
                <div class="h5p-container">
                    <h1>${content.title}</h1>
                    <div class="h5p-placeholder">
                        <h2>📚 H5P Interactive Content</h2>
                        <p>Content Type: ${content.metadata.mainLibrary}</p>
                        <p>This is a placeholder. In production, actual H5P content would be rendered here.</p>
                        <p><strong>Supported Types:</strong> Interactive Video, Course Presentation, Quiz, Timeline, etc.</p>
                    </div>
                </div>
                <script>
                    // Track user interactions
                    window.addEventListener('message', (event) => {
                        if (event.data.action === 'h5p_event') {
                            console.log('H5P Event:', event.data);
                            // Send to analytics
                        }
                    });
                </script>
            </body>
            </html>
        `;

        res.send(playerHtml);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Save user state/progress for H5P content
 */
router.post('/userdata/:contentId', async (req, res) => {
    try {
        const { contentId } = req.params;
        const { state, finished, score, maxScore } = req.body;
        const userId = req.user?.id || 'anonymous';

        // Save user progress (would store in database)
        console.log(`User ${userId} progress on H5P ${contentId}:`, {
            finished,
            score,
            maxScore
        });

        res.json({
            success: true,
            message: 'Progress saved'
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get H5P content types/libraries available
 */
router.get('/libraries', async (req, res) => {
    try {
        const libraries = [
            { name: 'H5P.InteractiveVideo', title: 'Interactive Video', majorVersion: 1, minorVersion: 22 },
            { name: 'H5P.CoursePresentation', title: 'Course Presentation', majorVersion: 1, minorVersion: 24 },
            { name: 'H5P.QuestionSet', title: 'Quiz (Question Set)', majorVersion: 1, minorVersion: 17 },
            { name: 'H5P.Timeline', title: 'Timeline', majorVersion: 1, minorVersion: 1 },
            { name: 'H5P.ImageHotspots', title: 'Image Hotspots', majorVersion: 1, minorVersion: 9 },
            { name: 'H5P.DragQuestion', title: 'Drag and Drop', majorVersion: 1, minorVersion: 14 },
        ];

        res.json({
            success: true,
            libraries: libraries
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Delete H5P content
 */
router.delete('/content/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const index = h5pContents.findIndex(c => c.id == id);

        if (index === -1) {
            return res.status(404).json({ error: 'H5P content not found' });
        }

        h5pContents.splice(index, 1);

        res.json({
            success: true,
            message: 'H5P content deleted'
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
