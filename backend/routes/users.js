const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { sequelize } = require('../config/database');
const { User, Video } = require('../models');

/**
 * @route   GET /api/users/profile/:id
 * @desc    Récupérer le profil d'un utilisateur
 * @access  Public
 */
router.get('/profile/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] },
      include: [{ model: Video, as: 'likedVideos', attributes: ['id', 'title', 'thumbnail', 'views'] }]
    });

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    const likedVideos = (user.likedVideos || []).map(v => ({
      _id: v.id,
      id: v.id,
      title: v.title,
      views: v.views,
      thumbnailUrl: v.thumbnail ? `/uploads/${v.thumbnail}` : null,
    }));

    res.json({ user: {
      _id: user.id,
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      likedVideos
    } });
  } catch (error) {
    console.error('Erreur lors de la récupération du profil:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

/**
 * @route   GET /api/users/history
 * @desc    Récupérer l'historique de visionnage
 * @access  Private
 */
router.get('/history', auth, async (req, res) => {
  try {
    // Récupérer les vidéos visionnées via l'association Many-to-Many avec champs through
    const watchedVideos = await req.user.getWatchedVideos({
      joinTableAttributes: ['watchedAt'],
      include: [{ model: User, as: 'uploader', attributes: ['id', 'username', 'avatar'] }],
      // Trier par la colonne du modèle through (WatchHistory.watchedAt)
      order: [[sequelize.col('WatchHistory.watchedAt'), 'DESC']]
    });

    const history = watchedVideos.map(v => ({
      video: {
        _id: v.id,
        id: v.id,
        title: v.title,
        views: v.views,
        thumbnailUrl: v.thumbnail ? `/uploads/${v.thumbnail}` : null,
        uploadedBy: v.uploader ? {
          _id: v.uploader.id,
          id: v.uploader.id,
          username: v.uploader.username,
          avatar: v.uploader.avatar,
        } : null,
      },
      watchedAt: v.WatchHistory?.watchedAt || null
    }));

    res.json({ history });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'historique:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

/**
 * @route   POST /api/users/history/:videoId
 * @desc    Ajouter une vidéo à l'historique
 * @access  Private
 */
router.post('/history/:videoId', auth, async (req, res) => {
  try {
    const video = await Video.findByPk(req.params.videoId);
    if (!video) {
      return res.status(404).json({ message: 'Vidéo non trouvée' });
    }

    // Ajoute une entrée d'historique (remplace l'ancienne si elle existe)
    const [through, created] = await req.user.addWatchedVideos(video, {
      through: { watchedAt: new Date() }
    });

    res.json({ message: 'Historique mis à jour' });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'historique:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

/**
 * @route   GET /api/users/liked
 * @desc    Récupérer les vidéos likées
 * @access  Private
 */
router.get('/liked', auth, async (req, res) => {
  try {
    const liked = await req.user.getLikedVideos({
      include: [{ model: User, as: 'uploader', attributes: ['id', 'username', 'avatar'] }]
    });

    const videos = liked.map(v => ({
      _id: v.id,
      id: v.id,
      title: v.title,
      views: v.views,
      thumbnailUrl: v.thumbnail ? `/uploads/${v.thumbnail}` : null,
      uploadedBy: v.uploader ? {
        _id: v.uploader.id,
        id: v.uploader.id,
        username: v.uploader.username,
        avatar: v.uploader.avatar,
      } : null,
    }));

    res.json({ videos });
  } catch (error) {
    console.error('Erreur lors de la récupération des vidéos likées:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;

