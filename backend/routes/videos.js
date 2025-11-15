const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { Op } = require('sequelize');
const { auth, isAdmin } = require('../middleware/auth');
const { Video, User, Comment } = require('../models');
let r2;
try { r2 = require('../services/r2'); } catch (e) { r2 = null; }
let supabaseService;
try { supabaseService = require('../services/supabase'); } catch (e) { supabaseService = null; }

// Helper: normaliser le format attendu par le frontend
function toVideoDTO(video) {
  const uploader = video.uploader ? {
    _id: video.uploader.id,
    id: video.uploader.id,
    username: video.uploader.username,
    avatar: video.uploader.avatar,
  } : null;

  const likes = Array.isArray(video.likers)
    ? video.likers.map(u => u.id)
    : [];

  const comments = Array.isArray(video.comments)
    ? video.comments.map(c => ({
        text: c.text,
        createdAt: c.createdAt,
        user: c.user ? {
          _id: c.user.id,
          id: c.user.id,
          username: c.user.username,
          avatar: c.user.avatar,
        } : null,
      }))
    : [];

  return {
    _id: video.id,
    id: video.id,
    title: video.title,
    description: video.description,
    genre: video.genre || 'Autre',
    views: video.views,
    url: video.url,
    videoUrl: video.url,
    thumbnailUrl: video.thumbnail ? `/uploads/${video.thumbnail}` : null,
    uploadedBy: uploader,
    likes,
    comments,
  };
}

// Récupérer toutes les vidéos
router.get('/', async (req, res) => {
  try {
    const videos = await Video.findAll({
      order: [['createdAt', 'DESC']],
      include: [
        { model: User, as: 'uploader', attributes: ['id', 'username', 'avatar'] },
        { model: User, as: 'likers', attributes: ['id'] }
      ]
    });

    res.json({ videos: videos.map(toVideoDTO) });
  } catch (error) {
    console.error('Erreur lors de la récupération des vidéos:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Récupérer vidéos populaires
router.get('/popular', async (req, res) => {
  try {
    const popularVideos = await Video.findAll({
      where: { views: { [Op.gt]: 1000 } },
      order: [['views', 'DESC']],
      include: [
        { model: User, as: 'uploader', attributes: ['id', 'username', 'avatar'] },
        { model: User, as: 'likers', attributes: ['id'] }
      ]
    });
    res.json({ videos: popularVideos.map(toVideoDTO) });
  } catch (error) {
    console.error('Erreur lors de la récupération des vidéos populaires:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Détail d'une vidéo
router.get('/:id', async (req, res) => {
  try {
    const video = await Video.findByPk(req.params.id, {
      include: [
        { model: User, as: 'uploader', attributes: ['id', 'username', 'avatar'] },
        { model: User, as: 'likers', attributes: ['id'] },
        { model: Comment, as: 'comments', include: [{ model: User, as: 'user', attributes: ['id', 'username', 'avatar'] }] }
      ]
    });

    if (!video) {
      return res.status(404).json({ message: 'Vidéo non trouvée' });
    }

    res.json({ video: toVideoDTO(video) });
  } catch (error) {
    console.error('Erreur lors du chargement de la vidéo:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Configuration Multer pour upload local
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const uploadsRoot = path.join(process.cwd(), 'uploads');
const videosDir = path.join(uploadsRoot, 'videos');
const thumbnailsDir = path.join(uploadsRoot, 'thumbnails');
ensureDir(videosDir);
ensureDir(thumbnailsDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const fname = String(file.fieldname || '').toLowerCase();
    if (fname.includes('thumb')) cb(null, thumbnailsDir);
    else cb(null, videosDir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || '';
    cb(null, unique + ext);
  }
});

const upload = multer({ storage });

/**
 * @route   POST /api/videos
 * @desc    Upload et création d'une vidéo
 * @access  Private (admin)
 */
router.post('/', auth, isAdmin, upload.fields([
  { name: 'video', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 }
]), async (req, res) => {
  try {
    const { title, description, genre } = req.body;
    if (!title || !req.files?.video?.[0]) {
      return res.status(400).json({ message: 'Titre et fichier vidéo requis' });
    }

    const videoFile = req.files.video[0];
    const thumbnailFile = req.files.thumbnail?.[0] || null;

    // Si R2 ou Supabase est configuré, uploader sur l'objet store et utiliser l'URL publique
    let url, thumbnail;
    if (r2 && process.env.R2_BUCKET_NAME) {
      try {
        const videoKey = `videos/${videoFile.filename}`;
        url = await r2.uploadFile(videoFile.path, videoKey, videoFile.mimetype);
        if (thumbnailFile) {
          const thumbKey = `thumbnails/${thumbnailFile.filename}`;
          thumbnail = await r2.uploadFile(thumbnailFile.path, thumbKey, thumbnailFile.mimetype);
          // store only the key or the full url depending on frontend expectation
          // here we store the full url
        } else {
          thumbnail = null;
        }

        // optional: remove local files
        try { fs.unlinkSync(videoFile.path); } catch (e) {}
        if (thumbnailFile) try { fs.unlinkSync(thumbnailFile.path); } catch (e) {}
      } catch (err) {
        console.error('R2 upload failed, falling back to other providers:', err.message);
        // fallback to next options below
      }
    }

    // If no URL yet and Supabase is configured, try Supabase storage
    if ((!url || url.startsWith('/uploads')) && supabaseService && process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const videoKey = `videos/${videoFile.filename}`;
        url = await supabaseService.uploadFile(videoFile.path, videoKey, videoFile.mimetype);
        if (thumbnailFile) {
          const thumbKey = `thumbnails/${thumbnailFile.filename}`;
          thumbnail = await supabaseService.uploadFile(thumbnailFile.path, thumbKey, thumbnailFile.mimetype);
        } else {
          thumbnail = thumbnail || null;
        }

        try { fs.unlinkSync(videoFile.path); } catch (e) {}
        if (thumbnailFile) try { fs.unlinkSync(thumbnailFile.path); } catch (e) {}
      } catch (err) {
        console.error('Supabase upload failed, falling back to local storage:', err.message);
        url = url || `/uploads/videos/${videoFile.filename}`;
        thumbnail = thumbnail || (thumbnailFile ? `/uploads/thumbnails/${thumbnailFile.filename}` : null);
      }
    }

    // If still no cloud URL, fall back to local /uploads
    if (!url) {
      url = `/uploads/videos/${videoFile.filename}`;
      thumbnail = thumbnail || (thumbnailFile ? `/uploads/thumbnails/${thumbnailFile.filename}` : null);
    }

    const created = await Video.create({
      title: String(title).trim(),
      description: (description || '').trim(),
      genre: genre || 'Autre',
      url,
      thumbnail,
      views: 0,
      uploadedBy: req.user.id
    });

    const withRelations = await Video.findByPk(created.id, {
      include: [
        { model: User, as: 'uploader', attributes: ['id', 'username', 'avatar'] },
        { model: User, as: 'likers', attributes: ['id'] }
      ]
    });

    return res.status(201).json({ message: 'Vidéo uploadée avec succès', video: toVideoDTO(withRelations) });
  } catch (error) {
    console.error('Erreur lors de l\'upload de la vidéo:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});


/**
 * @route   POST /api/videos/bulk
 * @desc    Upload multiple vidéos en une seule requête
 * @access  Private (admin)
 */
router.post('/bulk', auth, isAdmin, upload.fields([
  { name: 'videos', maxCount: 50 },
  { name: 'thumbnails', maxCount: 50 }
]), async (req, res) => {
  try {
    const metadata = req.body?.metadata ? JSON.parse(req.body.metadata) : [];
    const videoFiles = req.files?.videos || [];
    const thumbnailFiles = req.files?.thumbnails || [];

    if (!videoFiles.length) return res.status(400).json({ message: 'Aucun fichier vidéo fourni' });

    const createdIds = [];

    for (let i = 0; i < videoFiles.length; i++) {
      const videoFile = videoFiles[i];
      const thumbnailFile = thumbnailFiles[i] || null;
      const meta = metadata[i] || {};

      let url, thumbnail;
      if (r2 && process.env.R2_BUCKET_NAME) {
        try {
          const videoKey = `videos/${videoFile.filename}`;
          url = await r2.uploadFile(videoFile.path, videoKey, videoFile.mimetype);
          if (thumbnailFile) {
            const thumbKey = `thumbnails/${thumbnailFile.filename}`;
            thumbnail = await r2.uploadFile(thumbnailFile.path, thumbKey, thumbnailFile.mimetype);
          } else {
            thumbnail = null;
          }

          try { fs.unlinkSync(videoFile.path); } catch (e) {}
          if (thumbnailFile) try { fs.unlinkSync(thumbnailFile.path); } catch (e) {}
        } catch (err) {
          console.error('R2 upload failed for one file, falling back to local storage:', err.message);
          url = `/uploads/videos/${videoFile.filename}`;
          thumbnail = thumbnailFile ? `/uploads/thumbnails/${thumbnailFile.filename}` : null;
        }
      } else {
        url = `/uploads/videos/${videoFile.filename}`;
        thumbnail = thumbnailFile ? `/uploads/thumbnails/${thumbnailFile.filename}` : null;
      }

      const created = await Video.create({
        title: String(meta.title || videoFile.originalname).trim(),
        description: String(meta.description || '').trim(),
        genre: meta.genre || 'Autre',
        url,
        thumbnail,
        views: 0,
        uploadedBy: req.user.id
      });

      createdIds.push(created.id);
    }

    const createdWithRelations = await Video.findAll({
      where: { id: createdIds },
      include: [
        { model: User, as: 'uploader', attributes: ['id', 'username', 'avatar'] },
        { model: User, as: 'likers', attributes: ['id'] }
      ]
    });

    res.status(201).json({ message: 'Bulk upload réussi', videos: createdWithRelations.map(toVideoDTO) });
  } catch (error) {
    console.error('Erreur bulk upload:', error);
    res.status(500).json({ message: 'Erreur serveur lors du bulk upload' });
  }
});
/**
 * @route   POST /api/videos/:id/comment
 * @desc    Ajouter un commentaire à une vidéo
 * @access  Private
 */
router.post('/:id/comment', auth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !String(text).trim()) {
      return res.status(400).json({ message: 'Le commentaire ne peut pas être vide' });
    }

    const video = await Video.findByPk(req.params.id);
    if (!video) {
      return res.status(404).json({ message: 'Vidéo non trouvée' });
    }

    await Comment.create({
      text: String(text).trim(),
      userId: req.user.id,
      videoId: video.id
    });

    res.status(201).json({ message: 'Commentaire ajouté' });
  } catch (error) {
    console.error('Erreur lors de l\'ajout du commentaire:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

/**
 * @route   POST /api/videos/from-storage
 * @desc    Create a Video record from an existing storage URL (e.g. Supabase Storage public URL)
 * @access  Private (admin)
 */
router.post('/from-storage', auth, isAdmin, async (req, res) => {
  try {
    const { title, description, genre, videoUrl, thumbnailUrl } = req.body || {};
    if (!videoUrl || !title) return res.status(400).json({ message: 'videoUrl et title sont requis' });

    // Validate that the provided URL belongs to the configured Supabase project (public storage)
    if (process.env.SUPABASE_URL) {
      const expectedPrefix = `${process.env.SUPABASE_URL.replace(/\/+$/, '')}/storage/v1/object/public/${(process.env.SUPABASE_BUCKET || 'videos')}`;
      if (!videoUrl.startsWith(expectedPrefix)) {
        return res.status(400).json({ message: 'videoUrl doit provenir de Supabase Storage public du projet configuré' });
      }
    }

    const created = await Video.create({
      title: String(title).trim(),
      description: (description || '').trim(),
      genre: genre || 'Autre',
      url: videoUrl,
      thumbnail: thumbnailUrl || null,
      views: 0,
      uploadedBy: req.user.id
    });

    const withRelations = await Video.findByPk(created.id, {
      include: [
        { model: User, as: 'uploader', attributes: ['id', 'username', 'avatar'] },
        { model: User, as: 'likers', attributes: ['id'] }
      ]
    });

    res.status(201).json({ message: 'Vidéo enregistrée depuis storage', video: toVideoDTO(withRelations) });
  } catch (err) {
    console.error('Erreur enregistrer from-storage:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;
