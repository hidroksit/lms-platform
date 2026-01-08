const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

// Initialize Sequelize
const sequelize = new Sequelize('lms_db', 'postgres', 'password', {
    host: 'localhost',
    port: 5433,
    dialect: 'postgres',
    logging: false,
});

const run = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        // Define generic models for inserting data directly
        const Question = sequelize.define('Question', {
            type: DataTypes.ENUM('multiple_choice', 'true_false', 'short_answer', 'essay'),
            text: DataTypes.TEXT,
            options: DataTypes.JSONB,
            correctAnswer: DataTypes.TEXT,
            points: DataTypes.INTEGER,
        });

        const Exam = sequelize.define('Exam', {
            title: DataTypes.STRING,
            description: DataTypes.TEXT,
            duration: DataTypes.INTEGER,
            startTime: DataTypes.DATE,
            endTime: DataTypes.DATE,
            isProctored: DataTypes.BOOLEAN,
        });

        const Course = sequelize.define('Course', {
            title: DataTypes.STRING,
            description: DataTypes.TEXT,
            instructorId: DataTypes.INTEGER,
        });

        const ExamQuestion = sequelize.define('ExamQuestion', {
            examId: DataTypes.INTEGER,
            questionId: DataTypes.INTEGER,
        }, { timestamps: false });

        // Get a course (fix: ensure at least one course exists or create one)
        let course = await Course.findOne();
        if (!course) {
            console.log("No course found, skipping association or create one if needed (assuming seed.js ran)");
            // usually seed.js runs before this.
        }

        // 1. Create a Proctored Exam
        const proctoredExam = await Exam.create({
            title: "Final Sınavı (Proctored - Webcam)",
            description: "Bu sınavda kamera zorunluluğu vardır.",
            duration: 60,
            startTime: new Date(),
            endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week later
            isProctored: true,
            courseId: course ? course.id : 1
        });

        // 2. Create Questions
        const q1 = await Question.create({
            type: 'multiple_choice',
            text: 'Aşağıdakilerden hangisi React hooklarından biridir?',
            options: { A: 'useEffect', B: 'useDante', C: 'ngOnInit', D: 'v-model' },
            correctAnswer: 'A',
            points: 10
        });

        const q2 = await Question.create({
            type: 'multiple_choice',
            text: 'Node.js hangi motor üzerinde çalışır?',
            options: { A: 'SpiderMonkey', B: 'V8', C: 'Chakra', D: 'Gecko' },
            correctAnswer: 'B',
            points: 10
        });

        // 3. Associate Questions to Exam
        await ExamQuestion.create({ examId: proctoredExam.id, questionId: q1.id });
        await ExamQuestion.create({ examId: proctoredExam.id, questionId: q2.id });

        console.log(`Created Proctored Exam: ${proctoredExam.title} (ID: ${proctoredExam.id}) with questions.`);

    } catch (error) {
        console.error('Error seeding proctored exam:', error);
    } finally {
        await sequelize.close();
    }
};

run();
