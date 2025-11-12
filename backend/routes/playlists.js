const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { Playlist, Video, User } = require('../models');

/**
 * @route   GET /api/playlists
 * @desc    Récupérer toutes les playlists publiques
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const playlists = await Playlist.findAll({
      where: { isPublic: true },
      include: [
        { model: User, as: 'owner', attributes: ['id', 'username', 'avatar'] },
        { model: Video, as: 'videos', attributes: ['id', 'title', 'thumbnail'] }
      ]
    });

    const data = playlists.map(p => ({
      _id: p.id,
      id: p.id,
      name: p.name,
      description: p.description,
      isPublic: p.isPublic,
      owner: p.owner ? {
        _id: p.owner.id,
        id: p.owner.id,
        username: p.owner.username,
        avatar: p.owner.avatar,
      } : null,
      videos: (p.videos || []).map(v => ({
        _id: v.id,
        id: v.id,
        title: v.title,
        thumbnailUrl: v.thumbnail ? `/uploads/${v.thumbnail}` : null,
      }))
    }));

    res.json({ playlists: data });
  } catch (error) {
    console.error('Erreur lors de la récupération des playlists:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

/**
 * @route   GET /api/playlists/my
 * @desc    Récupérer les playlists de l'utilisateur connecté
 * @access  Private
 */
router.get('/my', auth, async (req, res) => {
  try {
    const playlists = await Playlist.findAll({
      where: { ownerId: req.user.id },
      include: [{ model: Video, as: 'videos', attributes: ['id', 'title', 'thumbnail'] }]
    });

    const data = playlists.map(p => ({
      _id: p.id,
      id: p.id,
      name: p.name,
      description: p.description,
      isPublic: p.isPublic,
      videos: (p.videos || []).map(v => ({
        _id: v.id,
        id: v.id,
        title: v.title,
        thumbnailUrl: v.thumbnail ? `/uploads/${v.thumbnail}` : null,
      }))
    }));

    res.json({ playlists: data });
  } catch (error) {
    console.error('Erreur lors de la récupération des playlists:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

/**
 * @route   GET /api/playlists/:id
 * @desc    Récupérer une playlist par son ID
 * @access  Public/Private
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const playlist = await Playlist.findByPk(req.params.id, {
      include: [
        { model: User, as: 'owner', attributes: ['id', 'username', 'avatar'] },
        { model: Video, as: 'videos', include: [{ model: User, as: 'uploader', attributes: ['id', 'username', 'avatar'] }] }
      ]
    });

    if (!playlist) {
      return res.status(404).json({ message: 'Playlist non trouvée' });
    }

    if (!playlist.isPublic && playlist.ownerId !== req.user.id) {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    const data = {
      _id: playlist.id,
      id: playlist.id,
      name: playlist.name,
      description: playlist.description,
      isPublic: playlist.isPublic,
      owner: playlist.owner ? {
        _id: playlist.owner.id,
        id: playlist.owner.id,
        username: playlist.owner.username,
        avatar: playlist.owner.avatar,
      } : null,
      videos: (playlist.videos || []).map(v => ({
        _id: v.id,
        id: v.id,
        title: v.title,
        thumbnailUrl: v.thumbnail ? `/uploads/${v.thumbnail}` : null,
        uploadedBy: v.uploader ? {
          _id: v.uploader.id,
          id: v.uploader.id,
          username: v.uploader.username,
          avatar: v.uploader.avatar,
        } : null,
      }))
    };

    res.json({ playlist: data });
  } catch (error) {
    console.error('Erreur lors de la récupération de la playlist:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

/**
 * @route   POST /api/playlists
 * @desc    Créer une nouvelle playlist
 * @access  Private
 */
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, isPublic } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ message: 'Le nom de la playlist est requis' });
    }

    const playlist = await Playlist.create({
      name: name.trim(),
      description: (description || '').trim(),
      ownerId: req.user.id,
      isPublic: !!isPublic
    });

    res.status(201).json({ message: 'Playlist créée avec succès', playlist: {
      _id: playlist.id,
      id: playlist.id,
      name: playlist.name,
      description: playlist.description,
      isPublic: playlist.isPublic,
    } });
  } catch (error) {
    console.error('Erreur lors de la création de la playlist:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

/**
 * @route   DELETE /api/playlists/:id
 * @desc    Supprimer une playlist
 * @access  Private (propriétaire uniquement)
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const playlist = await Playlist.findByPk(req.params.id);
    if (!playlist) {
      return res.status(404).json({ message: 'Playlist non trouvée' });
    }
    if (playlist.ownerId !== req.user.id) {
      return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à supprimer cette playlist' });
    }
    await playlist.destroy();
    res.json({ message: 'Playlist supprimée avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de la playlist:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

/**
 * @route   POST /api/playlists/:id/videos/:videoId
 * @desc    Ajouter une vidéo à une playlist
 * @access  Private (propriétaire uniquement)
 */
router.post('/:id/videos/:videoId', auth, async (req, res) => {
  try {
    const playlist = await Playlist.findByPk(req.params.id);
    if (!playlist) {
      return res.status(404).json({ message: 'Playlist non trouvée' });
    }
    if (playlist.ownerId !== req.user.id) {
      return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à modifier cette playlist' });
    }
    const video = await Video.findByPk(req.params.videoId);
    if (!video) {
      return res.status(404).json({ message: 'Vidéo non trouvée' });
    }
    await playlist.addVideo(video);
    res.json({ message: 'Vidéo ajoutée à la playlist' });
  } catch (error) {
    console.error('Erreur lors de l\'ajout de la vidéo à la playlist:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;

