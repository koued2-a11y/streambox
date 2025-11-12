# 🎬 StreamBox - Plateforme de Streaming Vidéo

Plateforme de streaming moderne avec gestion des utilisateurs, playlists et interface d'administration.

## 📁 Structure du Projet

```
streambox/
├── backend/          # API Node.js + Express + MongoDB
└── frontend/         # Application Next.js + React + TailwindCSS
```

## 🚀 Installation Rapide

### 1. Backend

```bash
cd backend
npm install
```

Créez un fichier `.env` dans `backend/` avec :
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/streambox
JWT_SECRET=votre_secret_super_long_ici
JWT_EXPIRES_IN=604800
FRONTEND_URL=http://localhost:3000
```

### 2. Frontend

```bash
cd frontend
npm install
```

Créez un fichier `.env.local` dans `frontend/` avec :
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### 3. Créer l'administrateur

```bash
cd backend
node scripts/createAdmin.js
```

Identifiants par défaut :
- Email : `admin@streambox.com`
- Mot de passe : `admin123`

## 🎬 Démarrer l'Application

**Terminal 1 - Backend :**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend :**
```bash
cd frontend
npm run dev
```

Accès :
- Frontend : http://localhost:3000
- Backend : http://localhost:5000

## ✨ Fonctionnalités

- ✅ Authentification JWT (inscription/connexion)
- ✅ Upload et streaming de vidéos (admin)
- ✅ Système de likes et commentaires
- ✅ Playlists personnalisées
- ✅ Historique de visionnage
- ✅ Interface d'administration
- ✅ Mode sombre/clair
- ✅ Design responsive

## 🛠️ Technologies

**Backend :** Node.js, Express, MongoDB, JWT, bcrypt, Multer  
**Frontend :** Next.js 14, React, TypeScript, TailwindCSS, Axios

## 📚 Documentation

Consultez `backend/API_DOCUMENTATION.md` pour la liste complète des endpoints.

## 📝 Licence

MIT

