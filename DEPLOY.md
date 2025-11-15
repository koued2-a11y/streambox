# Déploiement StreamBox — Guide rapide

Ce guide explique comment rendre l'application opérationnelle : déployer le frontend (Next.js) sur Vercel et le backend (Express/Sequelize) sur Render. Il couvre aussi les variables d'environnement nécessaires.

## Prérequis
- Node.js 18+ localement
- Un compte Vercel
- Un compte Render (ou autre PaaS) — Render est recommandé pour le backend
- (Optionnel mais recommandé) Un bucket Cloudflare R2 pour stocker les vidéos en production

## Configuration locale rapide
1. Copier les fichiers d'exemple :

```bash
cp backend/.env.example backend/.env
# Optionnel: créer .env local pour frontend si besoin
cp frontend/.env frontend/.env.local
```

2. Installer et lancer le backend :

```bash
# depuis le dossier backend
cd backend
npm install
# créer l'admin si besoin (après que la DB soit prête)
node scripts/createAdmin.js
npm run dev
```

3. Lancer le frontend en local :

```bash
# depuis le dossier frontend
cd frontend
npm install
npm run dev
```

La configuration locale utilise SQLite par défaut si vous ne fournissez pas `DB_HOST`/`DB_NAME`.

## Variables d'environnement importantes (backend)
- `PORT` — port HTTP (par défaut 5000)
- DB (ou laisser SQLite) : `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`
- `DB_USE_SQLITE` — `true` pour utiliser le fichier SQLite si aucune DB distante
- `DB_STORAGE` — chemin du fichier SQLite
- `JWT_SECRET` — clef secrète JWT (CRITIQUE)
- `JWT_EXPIRES_IN` — durée d'expiration (ex: `86400`)
- `FRONTEND_URLS` — origines autorisées CORS (séparées par des virgules)

Optionnel (Cloudflare R2) :
- `R2_BUCKET_NAME`
- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`

Si R2 est configuré, les vidéos seront uploadées sur R2 et servies par URL publique. Sinon, les uploads vont dans `/uploads` du serveur (utile uniquement pour dev/local).

## Déployer le backend sur Render
1. Créer un nouveau service Web sur Render.
2. Relier votre repo GitHub/GitLab au service.
3. Branch: `main`.
4. Root: `backend` (dans l'écran de configuration de Render, mettez le chemin du dossier backend).
5. Build Command: `npm install` (ou `npm ci`).
6. Start Command: `npm start`.
7. Ajouter les variables d'environnement listées ci-dessus dans le panel Render (notamment `JWT_SECRET`, DB si utilisée, ou R2 creds).
8. Si vous utilisez R2, assurez-vous que `R2_BUCKET_NAME` et credentials sont en place.

Notes:
- Render redémarrera le service automatiquement après déploiement.
- Les fichiers stockés dans `/uploads` sur Render ne sont pas garantis persistants entre déploiements ; utilisez R2 pour la production.

## Déployer le frontend sur Vercel
1. Importez le `frontend` comme nouveau projet Vercel (lors de l'import, définissez le `Root Directory` sur `frontend`).
2. Build Command: `npm run build` (par défaut Next.js détecte et utilisera `next build`).
3. Output Directory: `.next` (Vercel gère cela automatiquement).
4. Définir la variable `NEXT_PUBLIC_API_URL` vers l'URL publique de votre backend (ex: `https://votre-backend.onrender.com`).

## Notes spécifiques à Vercel / Serverless
- Ne pas compter sur le système de fichiers local pour les uploads en production (Vercel et Render peuvent être éphémères). Utilisez R2/S3.
- Le backend peut aussi être déployé en serverless (Vercel functions) ; ce dépôt contient `backend/api/index.js` pour une adaptation serverless, mais pour la gestion des uploads et l'état, Render (ou une instance Node) est plus simple.

## Après déploiement
- Créez l'administrateur (si vous n'avez pas changé le script) : le script `node scripts/createAdmin.js` peut être exécuté en remote via un shell sur votre instance ou en local si la DB distante est accessible.
- Connectez-vous via l'API `/api/auth/login` et obtenez un token JWT.
- Pour uploader des vidéos, utilisez l'endpoint `POST /api/videos` (multipart/form-data) avec le token admin en header `Authorization: Bearer <token>`.

## Check-list avant production
- [ ] Changer `JWT_SECRET` pour une valeur forte et unique
- [ ] Configurer R2 (ou un S3) et définir les variables R2
- [ ] Vérifier `FRONTEND_URLS` pour sécuriser CORS
- [ ] Installer HTTPS/Certificats si nécessaire (Render et Vercel gèrent HTTPS automatiquement)

---

Si vous voulez, je peux :
- Ajouter un formulaire d'upload dans le frontend pour administrer les vidéos (UI simple).
- Ajouter un `vercel.json` d'exemple ou des templates de déploiement.
- Créer un script d'automatisation pour exécuter `createAdmin` après déploiement.

Dites-moi quelle prochaine étape vous souhaitez que j'implémente.
