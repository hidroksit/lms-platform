const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Exam = sequelize.define('Exam', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        title: { type: DataTypes.STRING, allowNull: false },
        courseId: { type: DataTypes.INTEGER, allowNull: false },
    });

    const Question = sequelize.define('Question', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        examId: { type: DataTypes.INTEGER, allowNull: false },

        // Question Type: 'single_choice', 'multiple_choice', 'true_false', 'fill_blank', 
        // 'matching', 'ordering', 'short_answer', 'essay', 'file_upload'
        type: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'single_choice'
        },

        text: { type: DataTypes.TEXT, allowNull: false },

        // For single/multiple choice
        optionA: { type: DataTypes.TEXT },
        optionB: { type: DataTypes.TEXT },
        optionC: { type: DataTypes.TEXT },
        optionD: { type: DataTypes.TEXT },
        correctOption: { type: DataTypes.TEXT }, // 'A', 'B' or JSON array ["A","C"]

        // For fill-in-blank, short answer
        correctAnswer: { type: DataTypes.TEXT },

        // For matching, ordering (JSON format)
        matchingPairs: { type: DataTypes.JSON }, // [{left: 'X', right: 'Y'}]
        orderingItems: { type: DataTypes.JSON }, // ['Item1', 'Item2', ...]

        // Points for this question
        points: { type: DataTypes.FLOAT, defaultValue: 1.0 }
    });

    const ExamResult = sequelize.define('ExamResult', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        examId: { type: DataTypes.INTEGER, allowNull: false },
        studentId: { type: DataTypes.INTEGER, allowNull: false },
        score: { type: DataTypes.INTEGER, allowNull: false }, // 0-100
    });

    return { Exam, Question, ExamResult };
};
