require('dotenv').config();
const express = require('express');
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
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// Health route
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'StreamBox API est en ligne' });
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
