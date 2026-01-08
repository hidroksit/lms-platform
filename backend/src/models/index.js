const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: false,
});

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
// This was the missing part causing the Admin Panel crash
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
    PDFFile
};

module.exports = db;
