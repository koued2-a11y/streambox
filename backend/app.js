require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const { connectDB } = require('./config/database');

const app = express();

// Connect to DB (Sequelize)
connectDB();

// Middleware
// Autoriser l'origine fournie par l'environnement (Netlify) ;
// si elle n'est pas définie, utiliser `true` pour refléter l'origine
// de la requête (permet d'accepter le front déployé sur netlify sans
// bloquer). Le site doit définir `FRONTEND_URL` en production pour
// restreindre l'origine.
// CORS configuration : permettre plusieurs origines via FRONTEND_URLS (virgule séparée)
// Exemple: FRONTEND_URLS="https://streambox2.netlify.app,https://frontend-nx4h9jpkj-koueds-projects.vercel.app"
const rawFrontendUrls = process.env.FRONTEND_URLS || process.env.FRONTEND_URL || '';
const allowedOrigins = rawFrontendUrls.split(',').map(s => s.trim()).filter(Boolean);

app.use(cors({
  origin: function(origin, callback) {
    // Allow non-browser requests (curl, server-to-server) with no origin
    if (!origin) return callback(null, true);
    // If no list configured, allow all (fallback) but log a warning
    if (allowedOrigins.length === 0) {
      console.warn('CORS: no FRONTEND_URLS configured — allowing all origins by fallback');
      return callback(null, true);
    }
    // Exact match
    if (allowedOrigins.includes(origin)) return callback(null, true);

    // Allow common hosting platforms if they look like Vercel/Netlify or localhost (useful if user deploys to those)
    try {
      const u = new URL(origin);
      const hostname = u.hostname;
      if (hostname.endsWith('.vercel.app') || hostname.endsWith('.netlify.app') || hostname === 'localhost' || hostname.endsWith('.localhost')) {
        console.info(`CORS: allowing platform origin ${origin}`);
        return callback(null, true);
      }
    } catch (err) {
      // ignore URL parse errors
    }

    console.warn(`CORS: blocked origin ${origin} not in allowed list`);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400
}));
// Ensure Access-Control-Allow-Credentials is always explicitly set to 'true'
// Some proxies (Cloudflare / platform edge) may strip or change CORS headers,
// so we set it again here after the cors middleware.
app.use((req, res, next) => {
  try {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  } catch (e) {
    // ignore
  }
  next();
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Log incoming requests for debugging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - Origin: ${req.get('origin')}`);
  next();
});

// Static files
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/videos', require('./routes/videos'));
app.use('/api/users', require('./routes/users'));
app.use('/api/playlists', require('./routes/playlists'));
// Admin utilities (protected)
app.use('/api/admin', require('./routes/admin'));

// Health route
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'StreamBox API est en ligne' });
});

// Init admin route - crée le compte admin s'il n'existe pas
app.post('/api/init-admin', async (req, res) => {
  try {
    const { User } = require('./models');
    const { Op } = require('sequelize');
    
    const existingAdmin = await User.findOne({ where: { role: 'admin' } });
    if (existingAdmin) {
      return res.json({ 
        status: 'OK', 
        message: 'Admin existe déjà',
        admin: existingAdmin.email 
      });
    }

    const admin = await User.create({
      username: 'admin',
      email: 'admin@streambox.com',
      password: 'admin123',
      role: 'admin',
      avatar: null
    });

    res.json({ 
      status: 'CREATED', 
      message: 'Administrateur créé avec succès',
      email: admin.email,
      username: admin.username
    });
  } catch (error) {
    console.error('Erreur lors de la création admin:', error.message);
    res.status(500).json({ 
      status: 'ERROR',
      message: 'Impossible de créer l\'admin',
      error: error.message 
    });
  }
});

// 404
app.use((req, res) => {
  res.status(404).json({ message: 'Route non trouvée' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Erreur serveur', 
    error: process.env.NODE_ENV === 'development' ? err.message : undefined 
  });
});

module.exports = app;
