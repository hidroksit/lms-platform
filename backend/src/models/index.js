const { Sequelize } = require('sequelize');
require('dotenv').config();

let sequelize;
let isDbConnected = false;

// Check if DATABASE_URL is provided
if (process.env.DATABASE_URL) {
    sequelize = new Sequelize(process.env.DATABASE_URL, {
        dialect: 'postgres',
        logging: false,
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        }
    });
    isDbConnected = true;
} else {
    // Use SQLite in-memory for demo/development without external DB
    sequelize = new Sequelize({
        dialect: 'sqlite',
        storage: ':memory:',
        logging: false
    });
    console.log('⚠️  No DATABASE_URL found. Using in-memory SQLite database (demo mode).');
}

const User = require('./User')(sequelize);
const Course = require('./Course')(sequelize);

const { Exam, Question, ExamResult } = require('./Exam')(sequelize);
const { Video, PDFFile } = require('./Content')(sequelize);

// Associations

// User <-> Course (Instructor)
User.hasMany(Course, { foreignKey: 'instructorId' });
Course.belongsTo(User, { foreignKey: 'instructorId' });

// Course <-> Exam
Course.hasMany(Exam, { foreignKey: 'courseId' });
Exam.belongsTo(Course, { foreignKey: 'courseId' });

// Exam <-> Question
Exam.hasMany(Question, { foreignKey: 'examId' });
Question.belongsTo(Exam, { foreignKey: 'examId' });

// User <-> ExamResult (Student)
User.hasMany(ExamResult, { as: 'examResults', foreignKey: 'studentId' });
ExamResult.belongsTo(User, { as: 'student', foreignKey: 'studentId' });

// Exam <-> ExamResult
Exam.hasMany(ExamResult, { foreignKey: 'examId' });
ExamResult.belongsTo(Exam, { foreignKey: 'examId' });

// Content Associations
Video.belongsTo(Course, { foreignKey: 'courseId' });
Course.hasMany(Video, { foreignKey: 'courseId' });

PDFFile.belongsTo(Course, { foreignKey: 'courseId' });
Course.hasMany(PDFFile, { foreignKey: 'courseId' });

const db = {
    Sequelize,
    sequelize,
    User,
    Course,
    Exam,
    Question,
    ExamResult,
    Video,
    PDFFile,
    isDbConnected
};

module.exports = db;
