const express = require('express');
const router = express.Router();
const contentController = require('../controllers/contentController');
const authMiddleware = require('../middleware/authMiddleware');

// Upload endpoints (auth required)
router.post('/video', authMiddleware, contentController.upload.single('file'), contentController.uploadVideo);
router.post('/pdf', authMiddleware, contentController.upload.single('file'), contentController.uploadPDF);

// Get content by course
router.get('/videos/:courseId', contentController.getVideos);
router.get('/pdfs/:courseId', contentController.getPDFs);

module.exports = router;
