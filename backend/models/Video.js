const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Video = sequelize.define('Video', {
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: DataTypes.TEXT,
  genre: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'Autre'
  },
  url: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  thumbnail: DataTypes.STRING,
  views: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
});

module.exports = Video;
