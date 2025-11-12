Déploiement du frontend sur Netlify
=================================

Ce guide explique comment déployer uniquement le dossier `frontend` (Next.js v14) sur Netlify.

1) Fichiers ajoutés
- `netlify.toml` (à la racine) : commande de build et plugin `@netlify/plugin-nextjs`.

2) Configuration recommandée sur Netlify
- Connectez votre dépôt GitHub/GitLab/Bitbucket au site Netlify.
- Dans les paramètres du site (Site settings -> Build & deploy) :
  - Base directory: laissez vide (on installe/build depuis la racine via la commande du `netlify.toml`).
  - Build command: (défini par `netlify.toml`) `cd frontend && npm ci && npm run build`
  - Publish directory: `frontend/.next` (le plugin gère la sortie finale).

3) Variables d'environnement
- Ajoutez dans Netlify les variables d'environnement nécessaires à votre frontend, par exemple :
  - `NEXT_PUBLIC_API_URL` = URL publique de votre backend (ex: `https://api.mondomaine.com`).

4) Notes et options
- Vous pouvez aussi définir le répertoire de base (`Base directory`) sur `frontend` et
  utiliser `npm ci && npm run build` comme `Build command`.
- Le plugin `@netlify/plugin-nextjs` est référencé dans `netlify.toml` et Netlify l'installera lors du build.
- Si vous préférez tester localement avant déploiement, installez le Netlify CLI :

```bash
npm install -g netlify-cli
# depuis la racine du repo
cd frontend
npm ci
npm run build
netlify dev
```

5) Après le déploiement
- Dans Netlify, vérifiez la page `Functions` et `Edge Functions` si votre app Next.js utilise server-side rendering ou middlewares.
- Si vous avez besoin que je déploie aussi le backend sur une plateforme (Render/Vercel), dites-le et je propose une suite.
