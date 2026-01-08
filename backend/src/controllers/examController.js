const { Exam, Question, Course, ExamResult, User } = require('../models');

exports.createExam = async (req, res) => {
    try {
        const { title, courseId, questions } = req.body;

        // Check ownership/permissions (omitted for brevity)

        const exam = await Exam.create({ title, courseId });

        if (questions && questions.length > 0) {
            const questionData = questions.map(q => ({ ...q, examId: exam.id }));
            await Question.bulkCreate(questionData);
        }

        res.status(201).json(exam);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getAllExams = async (req, res) => {
    try {
        const exams = await Exam.findAll({
            include: [
                { model: Course, attributes: ['id', 'title', 'code'] },
                { model: Question, attributes: ['id'] }
            ],
            order: [['createdAt', 'DESC']]
        });
        res.json(exams);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getExamsByCourse = async (req, res) => {
    try {
        const exams = await Exam.findAll({
            where: { courseId: req.params.courseId },
            include: [Question]
        });
        res.json(exams);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getExamById = async (req, res) => {
    try {
        const exam = await Exam.findByPk(req.params.id, {
            include: [Question]
        });
        if (!exam) return res.status(404).json({ message: 'Exam not found' });
        res.json(exam);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.submitExam = async (req, res) => {
    try {
        const { examId, answers } = req.body; // answers: { questionId: userAnswer }
        const studentId = req.user.id;

        const questions = await Question.findAll({ where: { examId } });
        let totalPoints = 0;
        let earnedPoints = 0;

        questions.forEach(q => {
            const userAnswer = answers[q.id];
            totalPoints += q.points || 1.0;

            // Auto-grading based on type
            switch (q.type) {
                case 'single_choice':
                    if (userAnswer === q.correctOption) earnedPoints += q.points || 1.0;
                    break;

                case 'multiple_choice':
                    // correctOption is JSON array: ["A", "C"]
                    const correct = JSON.parse(q.correctOption || '[]');
                    const user = Array.isArray(userAnswer) ? userAnswer : [];
                    if (JSON.stringify(correct.sort()) === JSON.stringify(user.sort())) {
                        earnedPoints += q.points || 1.0;
                    }
                    break;

                case 'true_false':
                    if (userAnswer?.toLowerCase() === q.correctOption?.toLowerCase()) {
                        earnedPoints += q.points || 1.0;
                    }
                    break;

                case 'fill_blank':
                case 'short_answer':
                    // Case-insensitive trimmed comparison
                    if (userAnswer?.trim().toLowerCase() === q.correctAnswer?.trim().toLowerCase()) {
                        earnedPoints += q.points || 1.0;
                    }
                    break;

                case 'ordering':
                    // orderingItems: ['Item1', 'Item2']
                    const correctOrder = q.orderingItems || [];
                    if (JSON.stringify(correctOrder) === JSON.stringify(userAnswer)) {
                        earnedPoints += q.points || 1.0;
                    }
                    break;

                case 'matching':
                    // matchingPairs: [{left:'A', right:'1'}]
                    // userAnswer: {A: '1', B: '2'}
                    let allCorrect = true;
                    (q.matchingPairs || []).forEach(pair => {
                        if (userAnswer[pair.left] !== pair.right) allCorrect = false;
                    });
                    if (allCorrect) earnedPoints += q.points || 1.0;
                    break;

                case 'essay':
                case 'file_upload':
                    // Manual grading required, score is 0 for now
                    break;

                default:
                    break;
            }
        });

        const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;

        const result = await ExamResult.create({
            examId,
            studentId,
            score
        });

        res.json({ score, earnedPoints, totalPoints, result });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
