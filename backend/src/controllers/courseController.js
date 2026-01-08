const { Course, User } = require('../models');

exports.getAllCourses = async (req, res) => {
    try {
        const courses = await Course.findAll({
            include: {
                model: User,
                attributes: ['firstName', 'lastName', 'email']
            }
        });
        res.json(courses);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.createCourse = async (req, res) => {
    try {
        const { title, description, instructorId } = req.body;
        const course = await Course.create({
            title,
            description,
            instructorId
        });
        res.status(201).json(course);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getCourseById = async (req, res) => {
    try {
        const course = await Course.findByPk(req.params.id, {
            include: {
                model: User,
                attributes: ['firstName', 'lastName']
            }
        });
        if (!course) return res.status(404).json({ message: 'Course not found' });
        res.json(course);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
