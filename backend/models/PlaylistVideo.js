const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PlaylistVideo = sequelize.define('PlaylistVideo', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  playlistId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'playlists',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  videoId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'videos',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  order: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Ordre de la vidéo dans la playlist'
  }
}, {
  timestamps: true,
  tableName: 'playlist_videos',
  indexes: [
    {
      unique: true,
      fields: ['playlistId', 'videoId']
    }
  ]
});

module.exports = PlaylistVideo;
