const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

const { apiLimiter, auditLog } = require('./middleware/securityMiddleware');

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(apiLimiter);
app.use(auditLog);

const { sequelize, User, Course, Exam, Question } = require('./models');
const authRoutes = require('./routes/authRoutes');
const courseRoutes = require('./routes/courseRoutes');

// Sync Database and seed demo data
sequelize.sync({ force: true }).then(async () => {
  console.log('✅ Database synced');

  // Seed demo data
  try {
    // Create demo user
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('demo123', 10);

    await User.create({
      email: 'demo@lms.com',
      password: hashedPassword,
      firstName: 'Demo',
      lastName: 'Kullanıcı',
      role: 'instructor'
    });

    await User.create({
      email: 'admin@lms.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin'
    });

    await User.create({
      email: 'student@lms.com',
      password: hashedPassword,
      firstName: 'Öğrenci',
      lastName: 'Test',
      role: 'student'
    });

    // Create demo course
    await Course.create({
      code: 'MAT101',
      title: 'Matematik 101',
      description: 'Temel matematik dersi',
      instructorId: 1
    });

    await Course.create({
      code: 'FIZ101',
      title: 'Fizik 101',
      description: 'Temel fizik dersi',
      instructorId: 1
    });

    // Create demo exam
    const exam = await Exam.create({
      title: 'Ara Sınav',
      description: 'Matematik ara sınavı',
      duration: 60,
      startTime: new Date(),
      endTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      isProctored: false,
      courseId: 1
    });

    // Create demo questions
    await Question.create({
      examId: exam.id,
      type: 'single_choice',
      text: '2 + 2 = ?',
      optionA: '3',
      optionB: '4',
      optionC: '5',
      optionD: '6',
      correctOption: 'B',
      points: 10
    });

    console.log('✅ Demo data seeded successfully');
  } catch (err) {
    console.log('⚠️  Demo data seeding skipped:', err.message);
  }
}).catch((err) => {
  console.error('❌ Failed to sync db:', err.message);
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'LMS Backend is running',
    timestamp: new Date().toISOString(),
    mode: process.env.DATABASE_URL ? 'production' : 'demo'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'LMS Platform Backend',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      courses: '/api/courses',
      exams: '/api/exams'
    }
  });
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
app.use('/api/proctoring', require('./routes/proctoringRoutes'));
app.use('/api/rubrics', require('./routes/rubricRoutes'));
app.use('/api/qti', require('./routes/qtiRoutes'));
app.use('/api/roles', require('./routes/roleRoutes'));

app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Backend listening at http://0.0.0.0:${port}`);
});
