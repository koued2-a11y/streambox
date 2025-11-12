# 🔄 Guide de Migration MongoDB vers PostgreSQL

Ce document explique comment votre projet StreamBox a été migré de MongoDB vers PostgreSQL avec Sequelize ORM.

## 📋 Changements Effectués

### 1. Base de Données
- **Avant**: MongoDB (NoSQL)
- **Après**: PostgreSQL (SQL)
- **ORM**: Sequelize remplace Mongoose

### 2. Dépendances Modifiées

#### Supprimées:
- `mongoose` (^8.0.0)

#### Ajoutées:
- `sequelize` (^6.37.7) - ORM pour PostgreSQL
- `pg` (^8.16.3) - Driver PostgreSQL
- `pg-hstore` (^2.3.4) - Sérialisation pour types de données

### 3. Structure des Modèles

Tous les modèles ont été convertis de Mongoose vers Sequelize:

| Ancien (MongoDB) | Nouveau (PostgreSQL) | Description |
|-----------------|---------------------|-------------|
| `User.js` | `User.js` | Utilisateurs avec authentification |
| `Video.js` | `Video.js` | Vidéos uploadées |
| `Playlist.js` | `Playlist.js` | Playlists d'utilisateurs |
| ❌ (embedded) | `Comment.js` | Commentaires sur vidéos |
| ❌ (array ref) | `Like.js` | Likes sur vidéos |
| ❌ (embedded) | `WatchHistory.js` | Historique de visionnage |
| ❌ (array ref) | `PlaylistVideo.js` | Relation playlists-vidéos |

### 4. Nouveaux Fichiers

- `backend/models/Comment.js` - Table des commentaires
- `backend/models/Like.js` - Table des likes
- `backend/models/WatchHistory.js` - Table de l'historique
- `backend/models/PlaylistVideo.js` - Table de jonction playlists-vidéos
- `backend/models/index.js` - Définition des relations entre modèles
- `backend/.env.example` - Template de configuration

## 🚀 Installation et Configuration

### Étape 1: Installer PostgreSQL

#### Windows:
1. Téléchargez PostgreSQL depuis https://www.postgresql.org/download/windows/
2. Installez avec pgAdmin 4 inclus
3. Notez le mot de passe que vous définissez pour l'utilisateur `postgres`

#### macOS:
```bash
brew install postgresql
brew services start postgresql
```

#### Linux (Ubuntu/Debian):
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### Étape 2: Créer la Base de Données

1. Ouvrez pgAdmin ou utilisez psql:
```bash
psql -U postgres
```

2. Créez la base de données:
```sql
CREATE DATABASE streambox;
```

3. Quittez psql:
```sql
\q
```

### Étape 3: Configurer les Variables d'Environnement

1. Copiez le fichier d'exemple:
```bash
cp backend/.env.example backend/.env
```

2. Modifiez `backend/.env` avec vos informations:
```env
DB_NAME=streambox
DB_USER=postgres
DB_PASSWORD=votre_mot_de_passe_postgresql
DB_HOST=localhost
DB_PORT=5432

PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

JWT_SECRET=votre_secret_jwt_securise
JWT_EXPIRES_IN=86400
```

### Étape 4: Installer les Dépendances

```bash
cd backend
npm install
```

### Étape 5: Démarrer le Serveur

```bash
npm run dev
```

Au démarrage, Sequelize va automatiquement:
- Créer toutes les tables nécessaires
- Établir les relations (foreign keys)
- Synchroniser le schéma avec la base de données

Vous devriez voir:
```
✅ PostgreSQL connecté avec succès
✅ Modèles synchronisés avec la base de données
🚀 Serveur StreamBox démarré sur le port 5000
```

## 📊 Schéma de Base de Données

### Tables Créées:

1. **users** - Utilisateurs
   - id (PK, AUTO_INCREMENT)
   - username (UNIQUE)
   - email (UNIQUE)
   - password (hashed)
   - role (ENUM: 'user', 'admin')
   - avatar
   - createdAt, updatedAt

2. **videos** - Vidéos
   - id (PK, AUTO_INCREMENT)
   - title
   - description
   - videoUrl
   - thumbnailUrl
   - duration
   - genre (ENUM)
   - uploadedBy (FK -> users.id)
   - views
   - isPublic
   - createdAt, updatedAt

3. **playlists** - Playlists
   - id (PK, AUTO_INCREMENT)
   - name
   - description
   - ownerId (FK -> users.id)
   - isPublic
   - createdAt, updatedAt

4. **comments** - Commentaires
   - id (PK, AUTO_INCREMENT)
   - text
   - userId (FK -> users.id)
   - videoId (FK -> videos.id)
   - createdAt, updatedAt

5. **likes** - Likes
   - id (PK, AUTO_INCREMENT)
   - userId (FK -> users.id)
   - videoId (FK -> videos.id)
   - createdAt, updatedAt
   - UNIQUE(userId, videoId)

6. **watch_history** - Historique
   - id (PK, AUTO_INCREMENT)
   - userId (FK -> users.id)
   - videoId (FK -> videos.id)
   - watchedAt

7. **playlist_videos** - Relation Playlists-Vidéos
   - id (PK, AUTO_INCREMENT)
   - playlistId (FK -> playlists.id)
   - videoId (FK -> videos.id)
   - order
   - createdAt, updatedAt
   - UNIQUE(playlistId, videoId)

## 🔧 Différences Importantes

### Identifiants
- **MongoDB**: ObjectId (string hex 24 caractères)
- **PostgreSQL**: INTEGER AUTO_INCREMENT

⚠️ **Important**: Si vous aviez des données MongoDB, vous devrez adapter les références.

### Relations
- **MongoDB**: Utilise des références (ObjectId) et des tableaux embarqués
- **PostgreSQL**: Utilise des foreign keys et tables de jonction

### Requêtes
Les méthodes Mongoose doivent être adaptées pour Sequelize:

#### Mongoose (Avant):
```javascript
const user = await User.findById(id);
const videos = await Video.find({ uploadedBy: userId });
```

#### Sequelize (Après):
```javascript
const user = await User.findByPk(id);
const videos = await Video.findAll({ where: { uploadedBy: userId } });
```

## 📝 Prochaines Étapes

### Mise à jour des Routes

Les fichiers suivants devront être adaptés pour utiliser Sequelize:

1. **backend/routes/auth.js** - Authentification
2. **backend/routes/videos.js** - Gestion des vidéos
3. **backend/routes/users.js** - Gestion des utilisateurs
4. **backend/routes/playlists.js** - Gestion des playlists

### Exemple de Migration de Code

#### Avant (Mongoose):
```javascript
// Créer un utilisateur
const user = await User.create({ username, email, password });

// Trouver avec populate
const video = await Video.findById(id).populate('uploadedBy');

// Mettre à jour
await User.findByIdAndUpdate(id, { avatar: newAvatar });
```

#### Après (Sequelize):
```javascript
// Créer un utilisateur
const user = await User.create({ username, email, password });

// Trouver avec include (populate)
const video = await Video.findByPk(id, {
  include: [{ model: User, as: 'uploader' }]
});

// Mettre à jour
await User.update({ avatar: newAvatar }, { where: { id } });
// ou
const user = await User.findByPk(id);
user.avatar = newAvatar;
await user.save();
```

## 🔍 Vérification

Pour vérifier que tout fonctionne:

1. Connectez-vous à PostgreSQL:
```bash
psql -U postgres -d streambox
```

2. Listez les tables:
```sql
\dt
```

Vous devriez voir:
```
 Schema |      Name       | Type  |  Owner
--------+-----------------+-------+----------
 public | comments        | table | postgres
 public | likes           | table | postgres
 public | playlist_videos | table | postgres
 public | playlists       | table | postgres
 public | users           | table | postgres
 public | videos          | table | postgres
 public | watch_history   | table | postgres
```

3. Voir la structure d'une table:
```sql
\d users
```

## 💡 Conseils

1. **Sauvegardez vos données MongoDB** avant toute migration si vous en avez
2. **Testez localement** avant de déployer en production
3. **Utilisez des transactions** pour les opérations critiques
4. **Configurez des indexes** pour optimiser les performances
5. **Activez le logging** de Sequelize pendant le développement

## 🆘 Support

En cas de problème:
- Vérifiez que PostgreSQL est bien démarré
- Vérifiez vos identifiants dans `.env`
- Consultez les logs du serveur
- Vérifiez que le port 5432 n'est pas bloqué

## 📚 Documentation

- [Sequelize Docs](https://sequelize.org/docs/v6/)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [Migration Guide Sequelize](https://sequelize.org/docs/v6/other-topics/migrations/)
