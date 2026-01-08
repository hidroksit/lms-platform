const { User, Course, Exam, ExamResult } = require('../models');
const { Op, fn, col, literal } = require('sequelize');

exports.getDashboardStats = async (req, res) => {
    try {
        // Total counts
        const totalUsers = await User.count();
        const totalCourses = await Course.count();
        const totalExams = await Exam.count();
        const totalSubmissions = await ExamResult.count();

        // User distribution by role
        const usersByRole = await User.findAll({
            attributes: [
                'role',
                [fn('COUNT', col('role')), 'count']
            ],
            group: ['role'],
            raw: true
        });

        // Average scores
        const avgResult = await ExamResult.findOne({
            attributes: [[fn('AVG', col('score')), 'average']],
            raw: true
        });
        const averageScore = avgResult?.average || 0;

        // Top performing students (fixed)
        // Top performing students (Safer 2-step approach)
        const topResults = await ExamResult.findAll({
            attributes: [
                'studentId',
                [fn('AVG', col('score')), 'avgScore']
            ],
            group: ['studentId'],
            order: [[literal('"avgScore"'), 'DESC']],
            limit: 5,
            raw: true
        });

        // Fetch user details for these students
        const topStudents = await Promise.all(topResults.map(async (result) => {
            const student = await User.findByPk(result.studentId, {
                attributes: ['id', 'firstName', 'lastName', 'email']
            });
            return {
                ...result,
                student: student ? student.toJSON() : null
            };
        }));

        // Recent exam results
        const recentResults = await ExamResult.findAll({
            order: [['createdAt', 'DESC']],
            limit: 10,
            include: [
                { model: User, as: 'student', attributes: ['firstName', 'lastName'] },
                { model: Exam, attributes: ['title'] }
            ]
        });

        res.json({
            totalUsers,
            totalCourses,
            totalExams,
            totalSubmissions,
            usersByRole,
            averageScore: parseFloat(averageScore),
            topStudents,
            recentResults
        });
    } catch (err) {
        console.error('[Admin Dashboard Error]', err);
        res.status(500).json({ message: err.message });
    }
};
