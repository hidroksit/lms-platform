// Course Access Control Model
module.exports = (sequelize, DataTypes) => {
    const CourseAccess = sequelize.define('CourseAccess', {
        courseId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: true,
            references: {
                model: 'Courses',
                key: 'id'
            }
        },
        startDate: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: 'Course becomes accessible after this date'
        },
        endDate: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: 'Course becomes inaccessible after this date'
        },
        allowedGroups: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'JSON array of allowed user groups'
        },
        password: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: 'Password required to enroll'
        },
        prerequisiteCourseIds: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'JSON array of required course IDs'
        },
        maxEnrollments: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: 'Maximum number of students allowed'
        }
    });

    return CourseAccess;
};
