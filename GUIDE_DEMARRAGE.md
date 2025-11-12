# 🚀 Guide de Démarrage StreamBox

## 📋 Prérequis

- **Node.js** (version 18+) - [Télécharger](https://nodejs.org/)
- **MongoDB** - [Installation](https://www.mongodb.com/docs/manual/installation/)

## ⚙️ Installation

### 1. Backend

```bash
cd backend
npm install
```

Créez le fichier `.env` :
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/streambox
JWT_SECRET=streambox_super_secret_key_2024
JWT_EXPIRES_IN=604800
MAX_FILE_SIZE=524288000
UPLOAD_PATH=./uploads/videos
FRONTEND_URL=http://localhost:3000
```

### 2. Frontend

```bash
cd frontend
npm install
```

Créez le fichier `.env.local` :
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### 3. Créer l'Admin

```bash
cd backend
node scripts/createAdmin.js
```

## 🎬 Démarrage

### Option 1 : Script automatique (Windows)

Double-cliquez sur `start.bat` à la racine du projet.

### Option 2 : Manuel (2 terminaux)

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

## ✅ Accès

- **Frontend** : http://localhost:3000
- **Backend** : http://localhost:5000
- **Admin** : `admin@streambox.com` / `admin123`

## 🎯 Test

1. Ouvrez http://localhost:3000
2. Cliquez sur "Connexion"
3. Utilisez les identifiants admin
4. Accédez à l'interface Admin
5. Uploadez votre première vidéo !

## 🐛 Problèmes Courants

### MongoDB ne démarre pas
```bash
# Windows
net start MongoDB
```

### Port déjà utilisé
Changez le port dans `.env` et `.env.local`

## 📚 Plus d'infos

Consultez le README.md pour plus de détails.

