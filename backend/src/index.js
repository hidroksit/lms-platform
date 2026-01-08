const express = require('express');
const { Client } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

const { apiLimiter, auditLog } = require('./middleware/securityMiddleware');

app.use(cors());
app.use(express.json());
app.use(apiLimiter); // Rate limiting
app.use(auditLog); // Audit logging

const { sequelize } = require('./models');
const authRoutes = require('./routes/authRoutes');
const courseRoutes = require('./routes/courseRoutes');

// Sync Database
sequelize.sync({ alter: true }).then(() => {
  console.log('Database synced');
}).catch((err) => {
  console.error('Failed to sync db: ' + err.message);
});

app.get('/api/seed-temp', async (req, res) => {
  try {
    const { Exam, Question, Course } = require('./models');

    // First create the exam
    const proctoredExam = await Exam.create({
      title: "Final Sınavı (Proctored - Webcam)",
      description: "Bu sınavda kamera zorunluluğu vardır.",
      duration: 60,
      startTime: new Date(),
      endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      isProctored: true,
      courseId: 1
    });

    // Then create questions with the examId
    const q1 = await Question.create({
      examId: proctoredExam.id,
      type: 'single_choice',
      text: 'React hook hangisidir?',
      optionA: 'useEffect',
      optionB: 'ngOnInit',
      optionC: 'v-model',
      optionD: 'v-bind',
      correctOption: 'A',
      points: 10
    });
    const q2 = await Question.create({
      examId: proctoredExam.id,
      type: 'single_choice',
      text: 'Node.js motoru?',
      optionA: 'V8',
      optionB: 'SpiderMonkey',
      optionC: 'Chakra',
      optionD: 'Gecko',
      correctOption: 'A',
      points: 10
    });

    res.json({ success: true, message: 'Proctored exam seeded', examId: proctoredExam.id, questions: [q1.id, q2.id] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/exams', require('./routes/examRoutes'));
app.use('/api/content', require('./routes/contentRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/questions', require('./routes/questionRoutes'));
app.use('/api/2fa', require('./routes/twoFactorRoutes'));
app.use('/api/oauth', require('./routes/oauthRoutes'));
app.use('/api/scorm', require('./routes/scormRoutes'));
app.use('/api/optical-reader', require('./routes/opticalReaderRoutes'));
app.use('/api/access-control', require('./routes/accessControlRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/lti', require('./routes/ltiRoutes'));
app.use('/api/h5p', require('./routes/h5pRoutes'));

app.get('/api/health', async (req, res) => {
  try {
    const result = await sequelize.query('SELECT NOW()');
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      db_time: result[0][0].now
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.listen(port, () => {
  console.log(`Backend listening at http://localhost:${port}`);
});
