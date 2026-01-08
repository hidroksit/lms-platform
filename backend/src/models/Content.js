const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Video = sequelize.define('Video', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        title: { type: DataTypes.STRING, allowNull: false },
        description: { type: DataTypes.TEXT },
        filename: { type: DataTypes.STRING, allowNull: false }, // Original filename
        fileUrl: { type: DataTypes.STRING, allowNull: false }, // MinIO URL
        duration: { type: DataTypes.INTEGER }, // seconds
        courseId: { type: DataTypes.INTEGER, allowNull: false },
        uploaderId: { type: DataTypes.INTEGER, allowNull: false }
    });

    const PDFFile = sequelize.define('PDFFile', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        title: { type: DataTypes.STRING, allowNull: false },
        description: { type: DataTypes.TEXT },
        filename: { type: DataTypes.STRING, allowNull: false },
        fileUrl: { type: DataTypes.STRING, allowNull: false },
        pages: { type: DataTypes.INTEGER },
        courseId: { type: DataTypes.INTEGER, allowNull: false },
        uploaderId: { type: DataTypes.INTEGER, allowNull: false }
    });

    return { Video, PDFFile };
};
