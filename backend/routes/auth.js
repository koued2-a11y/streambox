const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { Op, UniqueConstraintError } = require('sequelize');
const { User, RefreshToken } = require('../models');
const { auth } = require('../middleware/auth');

// Refresh token lifetime (ms) — 30 days
const REFRESH_TOKEN_TTL = Number(process.env.REFRESH_TOKEN_TTL_MS) || 30 * 24 * 60 * 60 * 1000;

function generateRefreshToken() {
  return crypto.randomBytes(48).toString('hex');
}

async function createAndSetRefreshToken(res, userId) {
  const token = generateRefreshToken();
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL);

  await RefreshToken.create({ token, userId, expiresAt });

  const cookieOpts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: REFRESH_TOKEN_TTL
  };
  res.cookie('refreshToken', token, cookieOpts);
}

/**
 * @route   POST /api/auth/register
 * @desc    Inscription d'un nouvel utilisateur
 * @access  Public
 */
router.post('/register', [
  body('username').trim().isLength({ min: 3 }).withMessage('Le nom d\'utilisateur doit contenir au moins 3 caractères'),
  body('email').isEmail().withMessage('Email invalide'),
  body('password').isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password } = req.body;

    let user = await User.findOne({
      where: {
        [Op.or]: [{ email }, { username }]
      }
    });
    if (user) {
      return res.status(400).json({ message: 'Un utilisateur avec cet email ou nom d\'utilisateur existe déjà' });
    }

    user = await User.create({ username, email, password });

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: 'Configuration serveur invalide (JWT_SECRET manquant)' });
    }

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // create refresh token and set cookie
    await createAndSetRefreshToken(res, user.id);

    res.status(201).json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        avatar: user.avatar
      }
    });
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      return res.status(400).json({ message: 'Un utilisateur avec cet email ou nom d\'utilisateur existe déjà' });
    }
    console.error('Erreur lors de l\'inscription:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Connexion d'un utilisateur
 * @access  Public
 */
router.post('/login', [
  body('email').isEmail().withMessage('Email invalide'),
  body('password').notEmpty().withMessage('Le mot de passe est requis')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // create refresh token and set cookie
    await createAndSetRefreshToken(res, user.id);

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    Récupérer les informations de l'utilisateur connecté
 * @access  Private
 */
router.get('/me', auth, async (req, res) => {
  try {
    res.json({ user: req.user });
  } catch (error) {
    console.error('Erreur lors de la récupération du profil:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

/**
 * @route POST /api/auth/refresh
 * @desc  Refresh access token using refreshToken cookie
 * @access Public (cookie)
 */
router.post('/refresh', async (req, res) => {
  try {
    const token = req.cookies?.refreshToken || req.headers['x-refresh-token'];
    if (!token) return res.status(401).json({ message: 'Refresh token manquant' });

    const stored = await RefreshToken.findOne({ where: { token } });
    if (!stored) return res.status(401).json({ message: 'Refresh token invalide' });

    if (new Date(stored.expiresAt) < new Date()) {
      // expired
      await stored.destroy();
      return res.status(401).json({ message: 'Refresh token expiré' });
    }

    const user = await User.findByPk(stored.userId);
    if (!user) return res.status(401).json({ message: 'Utilisateur introuvable' });

    // rotate: remove old token and create a new one
    await stored.destroy();
    await createAndSetRefreshToken(res, user.id);

    const accessToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
    res.json({ token: accessToken, user: { id: user.id, username: user.username, email: user.email, role: user.role, avatar: user.avatar } });
  } catch (err) {
    console.error('Erreur refresh token:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

/**
 * @route POST /api/auth/logout
 * @desc  Revoke refresh token and clear cookie
 * @access Private
 */
router.post('/logout', auth, async (req, res) => {
  try {
    // remove cookie value if present
    const token = req.cookies?.refreshToken;
    if (token) {
      await RefreshToken.destroy({ where: { token } });
    }
    res.clearCookie('refreshToken');
    res.json({ message: 'Déconnecté' });
  } catch (err) {
    console.error('Erreur logout:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;

