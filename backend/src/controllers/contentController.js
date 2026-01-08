const { Video, PDFFile } = require('../models');
const multer = require('multer');
const { Client } = require('minio');

// MinIO Client (adjust credentials)
const minioClient = new Client({
    endPoint: process.env.MINIO_ENDPOINT || 'minio',
    port: parseInt(process.env.MINIO_PORT) || 9000,
    useSSL: false,
    accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
    secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin'
});

const BUCKET_NAME = 'lms-content';

// Ensure bucket exists
minioClient.bucketExists(BUCKET_NAME, (err, exists) => {
    if (!exists) {
        minioClient.makeBucket(BUCKET_NAME, 'us-east-1', () => { });
    }
});

const storage = multer.memoryStorage();
const upload = multer({ storage });

exports.upload = upload;

exports.uploadVideo = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

        const { title, description, courseId } = req.body;
        const filename = `videos/${Date.now()}_${req.file.originalname}`;

        await minioClient.putObject(BUCKET_NAME, filename, req.file.buffer, req.file.size);
        const fileUrl = `http://localhost:9000/${BUCKET_NAME}/${filename}`;

        const video = await Video.create({
            title,
            description,
            filename: req.file.originalname,
            fileUrl,
            courseId,
            uploaderId: req.user.id
        });

        res.status(201).json(video);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.uploadPDF = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

        const { title, description, courseId } = req.body;
        const filename = `pdfs/${Date.now()}_${req.file.originalname}`;

        await minioClient.putObject(BUCKET_NAME, filename, req.file.buffer, req.file.size);
        const fileUrl = `http://localhost:9000/${BUCKET_NAME}/${filename}`;

        const pdf = await PDFFile.create({
            title,
            description,
            filename: req.file.originalname,
            fileUrl,
            courseId,
            uploaderId: req.user.id
        });

        res.status(201).json(pdf);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getVideos = async (req, res) => {
    try {
        const videos = await Video.findAll({ where: { courseId: req.params.courseId } });
        res.json(videos);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getPDFs = async (req, res) => {
    try {
        const pdfs = await PDFFile.findAll({ where: { courseId: req.params.courseId } });
        res.json(pdfs);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
