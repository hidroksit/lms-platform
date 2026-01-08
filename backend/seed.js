const { sequelize, User, Course, Exam, Question, ExamResult } = require('./src/models');
const bcrypt = require('bcryptjs');

async function seed() {
    await sequelize.sync({ force: true });
    console.log('Database synced (cleared).');

    const password = await bcrypt.hash('123456', 10);
    const adminPassword = await bcrypt.hash('admin123', 10);

    console.log('Creating Users...');
    await User.create({
        email: 'admin@lms.com',
        password: adminPassword,
        role: 'admin',
        firstName: 'Yusuf',
        lastName: 'Admin'
    });

    const instructors = [];
    for (let i = 1; i <= 3; i++) {
        instructors.push(await User.create({
            email: `hocam${i}@lms.com`,
            password: password,
            role: 'instructor',
            firstName: `Eğitmen`,
            lastName: `${i}`
        }));
    }

    const students = [];
    for (let i = 1; i <= 10; i++) {
        students.push(await User.create({
            email: `ogrenci${i}@lms.com`,
            password: password,
            role: 'student',
            firstName: `Öğrenci`,
            lastName: `${i}`
        }));
    }

    // Assistant and Guest users
    await User.create({ email: 'asistan@lms.com', password, role: 'assistant', firstName: 'Asistan', lastName: 'Demo' });
    await User.create({ email: 'misafir@lms.com', password, role: 'guest', firstName: 'Misafir', lastName: 'User' });

    console.log('Creating Courses...');
    const courses = [];
    const courseTitles = [
        'İleri Seviye Web Geliştirme', 'Veri Yapıları ve Algoritmalar',
        'Yapay Zeka Temelleri', 'Mobil Uygulama Geliştirme',
        'Siber Güvenlik 101', 'Veritabanı Yönetimi'
    ];

    for (let i = 0; i < courseTitles.length; i++) {
        courses.push(await Course.create({
            title: courseTitles[i],
            description: `Bu ders kapsamında ${courseTitles[i]} konuları detaylıca işlenecektir.`,
            instructorId: instructors[i % instructors.length].id,
            thumbnailUrl: `https://via.placeholder.com/300?text=Course+${i + 1}`
        }));
    }

    console.log('Creating Exams and Questions...');
    const exams = [];
    for (const course of courses) {
        for (let j = 1; j <= 2; j++) {
            const exam = await Exam.create({
                title: `${course.title} - Sınav ${j}`,
                courseId: course.id
            });
            exams.push(exam);

            const questionsData = [];
            for (let k = 1; k <= 5; k++) {
                questionsData.push({
                    examId: exam.id,
                    type: 'single_choice',
                    text: `${course.title} hakkında soru ${k}?`,
                    optionA: 'Cevap A',
                    optionB: 'Cevap B',
                    optionC: 'Cevap C',
                    optionD: 'Cevap D',
                    correctOption: ['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)],
                    points: 1.0
                });
            }
            await Question.bulkCreate(questionsData);
        }
    }

    console.log('Creating Demo Exams with Diverse Question Types...');
    const demoExam1 = await Exam.create({
        title: 'Genel Deneme Sınavı (Çeşitli Sorular)',
        courseId: courses[0].id
    });

    await Question.bulkCreate([
        {
            examId: demoExam1.id,
            type: 'single_choice',
            text: 'Türkiye\'nin başkenti neresidir?',
            optionA: 'İstanbul',
            optionB: 'Ankara',
            optionC: 'İzmir',
            optionD: 'Bursa',
            correctOption: 'B',
            points: 1.0
        },
        {
            examId: demoExam1.id,
            type: 'multiple_choice',
            text: 'Hangileri programlama dilleridir? (Birden fazla seçin)',
            optionA: 'JavaScript',
            optionB: 'HTML',
            optionC: 'Python',
            optionD: 'CSS',
            correctOption: JSON.stringify(['A', 'C']),
            points: 2.0
        },
        {
            examId: demoExam1.id,
            type: 'true_false',
            text: 'Node.js bir backend teknolojisidir. (true/false)',
            correctOption: 'true',
            points: 1.0
        },
        {
            examId: demoExam1.id,
            type: 'fill_blank',
            text: 'React bir ______ kütüphanesidir. (tek kelime)',
            correctAnswer: 'javascript',
            points: 1.0
        },
        {
            examId: demoExam1.id,
            type: 'short_answer',
            text: 'HTTP nin açılımı nedir?',
            correctAnswer: 'hypertext transfer protocol',
            points: 1.5
        },
        {
            examId: demoExam1.id,
            type: 'essay',
            text: 'RESTful API\'nin avantajlarını açıklayın. (Manuel değerlendirme)',
            points: 5.0
        }
    ]);

    console.log('Simulating Exam Results...');
    for (const exam of exams) {
        for (const student of students) {
            if (Math.random() > 0.5) {
                await ExamResult.create({
                    examId: exam.id,
                    studentId: student.id,
                    score: Math.floor(Math.random() * 40) + 60
                });
            }
        }
    }

    console.log('Seed completed successfully!');
    console.log('-----------------------------------');
    console.log('Admin:       admin@lms.com / admin123');
    console.log('Instructors: hocam1@lms.com / 123456');
    console.log('Students:    ogrenci1@lms.com / 123456');
    console.log('Assistant:   asistan@lms.com / 123456');
    console.log('Guest:       misafir@lms.com / 123456');
    console.log('-----------------------------------');
}

seed().then(() => process.exit()).catch(err => {
    console.error(err);
    process.exit(1);
});
