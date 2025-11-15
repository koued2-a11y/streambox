const User = require('./User');
const Video = require('./Video');
const Playlist = require('./Playlist');
const Comment = require('./Comment');
const Like = require('./Like');
const WatchHistory = require('./WatchHistory');
const PlaylistVideo = require('./PlaylistVideo');
const RefreshToken = require('./RefreshToken');

// Relations User <-> Video
User.hasMany(Video, { foreignKey: 'uploadedBy', as: 'uploadedVideos' });
Video.belongsTo(User, { foreignKey: 'uploadedBy', as: 'uploader' });

// Relations User <-> Playlist
User.hasMany(Playlist, { foreignKey: 'ownerId', as: 'playlists' });
Playlist.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });

// Relations User <-> RefreshToken
User.hasMany(RefreshToken, { foreignKey: 'userId', as: 'refreshTokens' });
RefreshToken.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Relations Video <-> Comment
Video.hasMany(Comment, { foreignKey: 'videoId', as: 'comments' });
Comment.belongsTo(Video, { foreignKey: 'videoId', as: 'video' });

// Relations User <-> Comment
User.hasMany(Comment, { foreignKey: 'userId', as: 'comments' });
Comment.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Relations User <-> Video (Likes) - Many-to-Many
User.belongsToMany(Video, { 
  through: Like, 
  foreignKey: 'userId', 
  otherKey: 'videoId',
  as: 'likedVideos' 
});
Video.belongsToMany(User, { 
  through: Like, 
  foreignKey: 'videoId', 
  otherKey: 'userId',
  as: 'likers' 
});

// Relations User <-> Video (Watch History) - Many-to-Many
User.belongsToMany(Video, { 
  through: WatchHistory, 
  foreignKey: 'userId', 
  otherKey: 'videoId',
  as: 'watchedVideos' 
});
Video.belongsToMany(User, { 
  through: WatchHistory, 
  foreignKey: 'videoId', 
  otherKey: 'userId',
  as: 'viewers' 
});

// Relations Playlist <-> Video (Many-to-Many)
Playlist.belongsToMany(Video, { 
  through: PlaylistVideo, 
  foreignKey: 'playlistId', 
  otherKey: 'videoId',
  as: 'videos' 
});
Video.belongsToMany(Playlist, { 
  through: PlaylistVideo, 
  foreignKey: 'videoId', 
  otherKey: 'playlistId',
  as: 'playlists' 
});

module.exports = {
  User,
  Video,
  Playlist,
  Comment,
  Like,
  WatchHistory,
  PlaylistVideo,
  RefreshToken
};


