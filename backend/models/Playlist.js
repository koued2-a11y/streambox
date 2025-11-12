const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Playlist = sequelize.define('Playlist', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Le nom de la playlist est requis' },
      len: {
        args: [1, 50],
        msg: 'Le nom ne peut pas dépasser 50 caractères'
      }
    }
  },
  description: {
    type: DataTypes.STRING(200),
    allowNull: true,
    validate: {
      len: {
        args: [0, 200],
        msg: 'La description ne peut pas dépasser 200 caractères'
      }
    }
  },
  ownerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  isPublic: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  timestamps: true,
  tableName: 'playlists'
});

module.exports = Playlist;
