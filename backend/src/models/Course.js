const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Course = sequelize.define('Course', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        thumbnailUrl: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        instructorId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
    });

    return Course;
};
