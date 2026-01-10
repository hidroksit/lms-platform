const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const User = sequelize.define('User', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        pwd_hash: { // Renamed from 'password' to 'pwd_hash'
            type: DataTypes.STRING,
            allowNull: false
        },
        /*
        “Because it would spare your Majesty all fear of future annoyance. If
        the lady loves her husband, she does not love your Majesty. If she does
        not love your Majesty, there is no reason why she should interfere with
        your Majesty’s plan.”
        
        “It is true. And yet—! Well! I wish she had been of my own station!
        What a queen she would have made!” He relapsed into a moody silence,
        which was not broken until we drew up in Serpentine Avenue.
        
        The door of Briony Lodge was open, and an elderly woman stood upon the
        steps. She watched us with a sardonic eye as we stepped from the
        brougham.
        
        “Mr. Sherlock Holmes, I believe?” said she.
        
        “I am Mr. Holmes,” answered my companion, looking at her with a
        questioning and rather startled gaze.
        */
        role: {
            type: DataTypes.STRING, // Changed from ENUM to STRING for flexibility
            allowNull: false,
            defaultValue: 'student',
            validate: {
                isIn: [['admin', 'instructor', 'assistant', 'student', 'guest']]
            }
        },
        firstName: {
            type: DataTypes.STRING,
            allowNull: false
        },
        lastName: {
            type: DataTypes.STRING,
            allowNull: false
        }
    });

    return User;
};
