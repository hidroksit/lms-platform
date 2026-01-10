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

const { sequelize, User, Course, Exam, Question, ExamResult } = require('./models');
const authRoutes = require('./routes/authRoutes');
const courseRoutes = require('./routes/courseRoutes');

// Sync Database and seed demo data
sequelize.sync({ force: true }).then(async () => {
  console.log('✅ Database synced');

  try {
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('demo123', 10);

    // ========== USERS ==========
    const instructor = await User.create({
      email: 'demo@lms.com',
      password: hashedPassword,
      firstName: 'Demo',
      lastName: 'Eğitmen',
      role: 'instructor'
    });

    const admin = await User.create({
      email: 'admin@lms.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin'
    });

    const student1 = await User.create({
      email: 'student@lms.com',
      password: hashedPassword,
      firstName: 'Ahmet',
      lastName: 'Yılmaz',
      role: 'student'
    });

    const student2 = await User.create({
      email: 'student2@lms.com',
      password: hashedPassword,
      firstName: 'Ayşe',
      lastName: 'Demir',
      role: 'student'
    });

    const student3 = await User.create({
      email: 'student3@lms.com',
      password: hashedPassword,
      firstName: 'Mehmet',
      lastName: 'Kaya',
      role: 'student'
    });

    // ========== COURSES ==========
    const mathCourse = await Course.create({
      code: 'MAT101',
      title: 'Matematik 101',
      description: 'Temel matematik kavramları: Sayılar, denklemler, fonksiyonlar ve limit.',
      instructorId: instructor.id
    });

    const physicsCourse = await Course.create({
      code: 'FIZ101',
      title: 'Fizik 101',
      description: 'Temel fizik kavramları: Hareket, kuvvet, enerji ve dalgalar.',
      instructorId: instructor.id
    });

    const programmingCourse = await Course.create({
      code: 'PRG101',
      title: 'Programlama 101',
      description: 'Temel programlama kavramları: Değişkenler, döngüler, fonksiyonlar.',
      instructorId: instructor.id
    });

    const webCourse = await Course.create({
      code: 'WEB201',
      title: 'Web Geliştirme',
      description: 'Modern web teknolojileri: HTML, CSS, JavaScript, React.',
      instructorId: instructor.id
    });

    // ========== EXAMS ==========

    // Math Exams
    const mathMidterm = await Exam.create({
      title: 'Matematik Ara Sınav',
      description: 'Temel matematik işlemleri ve denklemler',
      duration: 60,
      startTime: new Date(),
      endTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      isProctored: false,
      courseId: mathCourse.id
    });

    const mathFinal = await Exam.create({
      title: 'Matematik Final Sınavı',
      description: 'Tüm konuları kapsayan final sınavı',
      duration: 90,
      startTime: new Date(),
      endTime: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      isProctored: true,
      courseId: mathCourse.id
    });

    // Physics Exams
    const physicsQuiz = await Exam.create({
      title: 'Fizik Quiz 1',
      description: 'Hareket ve hız konuları',
      duration: 30,
      startTime: new Date(),
      endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      isProctored: false,
      courseId: physicsCourse.id
    });

    const physicsMidterm = await Exam.create({
      title: 'Fizik Ara Sınav',
      description: 'Newton kanunları ve enerji',
      duration: 60,
      startTime: new Date(),
      endTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      isProctored: false,
      courseId: physicsCourse.id
    });

    // Programming Exams
    const progQuiz = await Exam.create({
      title: 'Programlama Quiz',
      description: 'Değişkenler ve veri tipleri',
      duration: 30,
      startTime: new Date(),
      endTime: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      isProctored: false,
      courseId: programmingCourse.id
    });

    const progMidterm = await Exam.create({
      title: 'Programlama Ara Sınav',
      description: 'Algoritmalar ve döngüler',
      duration: 60,
      startTime: new Date(),
      endTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      isProctored: true,
      courseId: programmingCourse.id
    });

    // Web Development Exam
    const webMidterm = await Exam.create({
      title: 'Web Geliştirme Ara Sınav',
      description: 'HTML, CSS ve JavaScript temelleri',
      duration: 45,
      startTime: new Date(),
      endTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      isProctored: false,
      courseId: webCourse.id
    });

    // ========== QUESTIONS ==========

    // Math Midterm Questions
    await Question.bulkCreate([
      { examId: mathMidterm.id, type: 'single_choice', text: '5 + 7 = ?', optionA: '10', optionB: '11', optionC: '12', optionD: '13', correctOption: 'C', points: 10 },
      { examId: mathMidterm.id, type: 'single_choice', text: '15 - 8 = ?', optionA: '5', optionB: '6', optionC: '7', optionD: '8', correctOption: 'C', points: 10 },
      { examId: mathMidterm.id, type: 'single_choice', text: '6 × 7 = ?', optionA: '40', optionB: '42', optionC: '44', optionD: '48', correctOption: 'B', points: 10 },
      { examId: mathMidterm.id, type: 'single_choice', text: '81 ÷ 9 = ?', optionA: '7', optionB: '8', optionC: '9', optionD: '10', correctOption: 'C', points: 10 },
      { examId: mathMidterm.id, type: 'single_choice', text: 'x + 5 = 12 ise x = ?', optionA: '5', optionB: '6', optionC: '7', optionD: '8', correctOption: 'C', points: 10 },
      { examId: mathMidterm.id, type: 'single_choice', text: '2³ = ?', optionA: '4', optionB: '6', optionC: '8', optionD: '16', correctOption: 'C', points: 10 },
      { examId: mathMidterm.id, type: 'single_choice', text: '√16 = ?', optionA: '2', optionB: '4', optionC: '8', optionD: '16', correctOption: 'B', points: 10 },
      { examId: mathMidterm.id, type: 'single_choice', text: '25% kaçtır?', optionA: '1/2', optionB: '1/3', optionC: '1/4', optionD: '1/5', correctOption: 'C', points: 10 },
      { examId: mathMidterm.id, type: 'single_choice', text: '3x = 24 ise x = ?', optionA: '6', optionB: '7', optionC: '8', optionD: '9', correctOption: 'C', points: 10 },
      { examId: mathMidterm.id, type: 'single_choice', text: 'Bir üçgenin iç açıları toplamı kaç derecedir?', optionA: '90°', optionB: '180°', optionC: '270°', optionD: '360°', correctOption: 'B', points: 10 }
    ]);

    // Math Final Questions
    await Question.bulkCreate([
      { examId: mathFinal.id, type: 'single_choice', text: 'lim(x→0) sin(x)/x = ?', optionA: '0', optionB: '1', optionC: '∞', optionD: 'Tanımsız', correctOption: 'B', points: 15 },
      { examId: mathFinal.id, type: 'single_choice', text: 'd/dx(x²) = ?', optionA: 'x', optionB: '2x', optionC: 'x²', optionD: '2', correctOption: 'B', points: 15 },
      { examId: mathFinal.id, type: 'single_choice', text: '∫x dx = ?', optionA: 'x', optionB: 'x²', optionC: 'x²/2 + C', optionD: '2x', correctOption: 'C', points: 15 },
      { examId: mathFinal.id, type: 'single_choice', text: 'log₁₀(100) = ?', optionA: '1', optionB: '2', optionC: '10', optionD: '100', correctOption: 'B', points: 15 },
      { examId: mathFinal.id, type: 'single_choice', text: 'sin²θ + cos²θ = ?', optionA: '0', optionB: '1', optionC: '2', optionD: 'sin2θ', correctOption: 'B', points: 15 }
    ]);

    // Physics Quiz Questions
    await Question.bulkCreate([
      { examId: physicsQuiz.id, type: 'single_choice', text: 'Hız birimi nedir?', optionA: 'm', optionB: 'm/s', optionC: 'm/s²', optionD: 'kg', correctOption: 'B', points: 20 },
      { examId: physicsQuiz.id, type: 'single_choice', text: 'İvme birimi nedir?', optionA: 'm', optionB: 'm/s', optionC: 'm/s²', optionD: 'N', correctOption: 'C', points: 20 },
      { examId: physicsQuiz.id, type: 'single_choice', text: 'v = v₀ + at formülünde "a" neyi temsil eder?', optionA: 'Hız', optionB: 'Zaman', optionC: 'İvme', optionD: 'Konum', correctOption: 'C', points: 20 },
      { examId: physicsQuiz.id, type: 'single_choice', text: 'Serbest düşmede g yaklaşık kaçtır?', optionA: '5 m/s²', optionB: '10 m/s²', optionC: '15 m/s²', optionD: '20 m/s²', correctOption: 'B', points: 20 },
      { examId: physicsQuiz.id, type: 'single_choice', text: 'Eşit hızlı hareket grafiğinde eğim neyi verir?', optionA: 'İvme', optionB: 'Hız', optionC: 'Konum', optionD: 'Zaman', correctOption: 'B', points: 20 }
    ]);

    // Physics Midterm Questions
    await Question.bulkCreate([
      { examId: physicsMidterm.id, type: 'single_choice', text: 'F = m × a formülü hangi kanunu ifade eder?', optionA: 'Newton 1. Kanun', optionB: 'Newton 2. Kanun', optionC: 'Newton 3. Kanun', optionD: 'Kepler Kanunu', correctOption: 'B', points: 10 },
      { examId: physicsMidterm.id, type: 'single_choice', text: 'Kuvvet birimi nedir?', optionA: 'Joule', optionB: 'Watt', optionC: 'Newton', optionD: 'Pascal', correctOption: 'C', points: 10 },
      { examId: physicsMidterm.id, type: 'single_choice', text: 'Kinetik enerji formülü nedir?', optionA: 'mgh', optionB: '½mv²', optionC: 'Fd', optionD: 'Pt', correctOption: 'B', points: 10 },
      { examId: physicsMidterm.id, type: 'single_choice', text: 'Potansiyel enerji formülü nedir?', optionA: 'mgh', optionB: '½mv²', optionC: 'Fd', optionD: 'Pt', correctOption: 'A', points: 10 },
      { examId: physicsMidterm.id, type: 'single_choice', text: 'Güç birimi nedir?', optionA: 'Joule', optionB: 'Watt', optionC: 'Newton', optionD: 'Hertz', correctOption: 'B', points: 10 },
      { examId: physicsMidterm.id, type: 'single_choice', text: '10 kg kütleye 20 N kuvvet uygulanırsa ivme kaç m/s²?', optionA: '1', optionB: '2', optionC: '5', optionD: '10', correctOption: 'B', points: 10 },
      { examId: physicsMidterm.id, type: 'single_choice', text: 'İş birimi nedir?', optionA: 'Newton', optionB: 'Watt', optionC: 'Joule', optionD: 'Hertz', correctOption: 'C', points: 10 },
      { examId: physicsMidterm.id, type: 'single_choice', text: 'Momentum formülü nedir?', optionA: 'mv', optionB: 'ma', optionC: 'mgh', optionD: 'Ft', correctOption: 'A', points: 10 }
    ]);

    // Programming Quiz Questions
    await Question.bulkCreate([
      { examId: progQuiz.id, type: 'single_choice', text: 'JavaScript\'te değişken tanımlamak için hangisi kullanılmaz?', optionA: 'var', optionB: 'let', optionC: 'const', optionD: 'int', correctOption: 'D', points: 20 },
      { examId: progQuiz.id, type: 'single_choice', text: 'Python\'da yorum satırı nasıl başlar?', optionA: '//', optionB: '#', optionC: '/*', optionD: '--', correctOption: 'B', points: 20 },
      { examId: progQuiz.id, type: 'single_choice', text: 'Hangisi bir veri tipi değildir?', optionA: 'String', optionB: 'Integer', optionC: 'Loop', optionD: 'Boolean', correctOption: 'C', points: 20 },
      { examId: progQuiz.id, type: 'single_choice', text: '5 + "5" JavaScript\'te ne döner?', optionA: '10', optionB: '"55"', optionC: 'Error', optionD: 'NaN', correctOption: 'B', points: 20 },
      { examId: progQuiz.id, type: 'single_choice', text: 'Array index nereden başlar?', optionA: '-1', optionB: '0', optionC: '1', optionD: '2', correctOption: 'B', points: 20 }
    ]);

    // Programming Midterm Questions
    await Question.bulkCreate([
      { examId: progMidterm.id, type: 'single_choice', text: 'for döngüsü hangi durumda kullanılır?', optionA: 'Koşul doğru olduğu sürece', optionB: 'Belirli sayıda tekrar', optionC: 'Sadece bir kez', optionD: 'Hiçbir zaman', correctOption: 'B', points: 10 },
      { examId: progMidterm.id, type: 'single_choice', text: 'while döngüsü hangi durumda kullanılır?', optionA: 'Koşul doğru olduğu sürece', optionB: 'Belirli sayıda tekrar', optionC: 'Sadece bir kez', optionD: 'Hiçbir zaman', correctOption: 'A', points: 10 },
      { examId: progMidterm.id, type: 'single_choice', text: 'Fonksiyon ne işe yarar?', optionA: 'Değişken tanımlar', optionB: 'Kod tekrarını önler', optionC: 'Sadece sayı hesaplar', optionD: 'Döngü oluşturur', correctOption: 'B', points: 10 },
      { examId: progMidterm.id, type: 'single_choice', text: 'Recursive fonksiyon nedir?', optionA: 'Hızlı fonksiyon', optionB: 'Kendini çağıran fonksiyon', optionC: 'Parametre almayan fonksiyon', optionD: 'Değer döndürmeyen fonksiyon', correctOption: 'B', points: 10 },
      { examId: progMidterm.id, type: 'single_choice', text: 'O(n) ne demektir?', optionA: 'Sabit zaman', optionB: 'Logaritmik zaman', optionC: 'Lineer zaman', optionD: 'Karesel zaman', correctOption: 'C', points: 10 },
      { examId: progMidterm.id, type: 'single_choice', text: 'Stack veri yapısı hangi prensiple çalışır?', optionA: 'FIFO', optionB: 'LIFO', optionC: 'Random', optionD: 'Priority', correctOption: 'B', points: 10 },
      { examId: progMidterm.id, type: 'single_choice', text: 'Queue veri yapısı hangi prensiple çalışır?', optionA: 'FIFO', optionB: 'LIFO', optionC: 'Random', optionD: 'Priority', correctOption: 'A', points: 10 },
      { examId: progMidterm.id, type: 'single_choice', text: 'Binary Search algoritmasının zaman karmaşıklığı nedir?', optionA: 'O(1)', optionB: 'O(n)', optionC: 'O(log n)', optionD: 'O(n²)', correctOption: 'C', points: 10 }
    ]);

    // Web Development Questions
    await Question.bulkCreate([
      { examId: webMidterm.id, type: 'single_choice', text: 'HTML ne anlama gelir?', optionA: 'Hyper Text Markup Language', optionB: 'High Tech Modern Language', optionC: 'Hyper Transfer Markup Language', optionD: 'Home Tool Markup Language', correctOption: 'A', points: 10 },
      { examId: webMidterm.id, type: 'single_choice', text: 'CSS ne için kullanılır?', optionA: 'Veritabanı', optionB: 'Stil ve tasarım', optionC: 'Sunucu programlama', optionD: 'Güvenlik', correctOption: 'B', points: 10 },
      { examId: webMidterm.id, type: 'single_choice', text: 'JavaScript hangi tarafta çalışır?', optionA: 'Sadece sunucu', optionB: 'Sadece istemci', optionC: 'Her iki taraf', optionD: 'Veritabanı', correctOption: 'C', points: 10 },
      { examId: webMidterm.id, type: 'single_choice', text: 'div etiketi ne için kullanılır?', optionA: 'Link oluşturma', optionB: 'Bölüm oluşturma', optionC: 'Resim ekleme', optionD: 'Liste oluşturma', correctOption: 'B', points: 10 },
      { examId: webMidterm.id, type: 'single_choice', text: 'React nedir?', optionA: 'CSS framework', optionB: 'Database', optionC: 'JavaScript library', optionD: 'Programming language', correctOption: 'C', points: 10 },
      { examId: webMidterm.id, type: 'single_choice', text: 'npm ne için kullanılır?', optionA: 'Paket yönetimi', optionB: 'Veritabanı', optionC: 'Stil yönetimi', optionD: 'Sunucu', correctOption: 'A', points: 10 },
      { examId: webMidterm.id, type: 'single_choice', text: 'Responsive tasarım nedir?', optionA: 'Hızlı tasarım', optionB: 'Farklı ekran boyutlarına uyumlu tasarım', optionC: 'Güvenli tasarım', optionD: 'Animasyonlu tasarım', correctOption: 'B', points: 10 },
      { examId: webMidterm.id, type: 'single_choice', text: 'API ne anlama gelir?', optionA: 'Application Programming Interface', optionB: 'Advanced Programming Interface', optionC: 'Automatic Program Installation', optionD: 'Application Process Integration', correctOption: 'A', points: 10 },
      { examId: webMidterm.id, type: 'single_choice', text: 'HTTP status code 404 ne anlama gelir?', optionA: 'Başarılı', optionB: 'Sunucu hatası', optionC: 'Sayfa bulunamadı', optionD: 'Yetki hatası', correctOption: 'C', points: 10 },
      { examId: webMidterm.id, type: 'single_choice', text: 'JSON ne için kullanılır?', optionA: 'Stil tanımlama', optionB: 'Veri alışverişi', optionC: 'Animasyon', optionD: 'Güvenlik', correctOption: 'B', points: 10 }
    ]);

    // ========== EXAM RESULTS (Sample completed exams) ==========
    await ExamResult.create({
      examId: mathMidterm.id,
      studentId: student1.id,
      score: 85,
      answers: JSON.stringify({ 1: 'C', 2: 'C', 3: 'B', 4: 'C', 5: 'C', 6: 'C', 7: 'B', 8: 'C', 9: 'C', 10: 'B' }),
      submittedAt: new Date()
    });

    await ExamResult.create({
      examId: physicsQuiz.id,
      studentId: student1.id,
      score: 100,
      answers: JSON.stringify({ 1: 'B', 2: 'C', 3: 'C', 4: 'B', 5: 'B' }),
      submittedAt: new Date()
    });

    await ExamResult.create({
      examId: mathMidterm.id,
      studentId: student2.id,
      score: 70,
      answers: JSON.stringify({ 1: 'C', 2: 'C', 3: 'A', 4: 'C', 5: 'C', 6: 'B', 7: 'B', 8: 'C', 9: 'A', 10: 'B' }),
      submittedAt: new Date()
    });

    console.log('✅ Demo data seeded successfully');
    console.log('   - 5 users created');
    console.log('   - 4 courses created');
    console.log('   - 7 exams created');
    console.log('   - 51 questions created');
    console.log('   - 3 exam results created');
  } catch (err) {
    console.log('⚠️  Demo data seeding error:', err.message);
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
app.use('/api/omr', require('./routes/omrRoutes'));  // OpenCV OMR Processing
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
