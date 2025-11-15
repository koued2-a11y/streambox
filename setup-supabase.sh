#!/bin/bash
set -e

echo "====== Configuration Supabase + Render + Vercel ======"
echo ""
echo "Ce script configure tout pour la persistance sur Supabase et Render."
echo ""

# Récupérer les clés de l'utilisateur
read -p "Entrez votre SUPABASE_SERVICE_ROLE_KEY: " SUPABASE_SERVICE_ROLE_KEY
read -p "Entrez votre SUPABASE_ANON_KEY: " SUPABASE_ANON_KEY
read -p "Entrez votre DATABASE_URL (Postgres de Supabase): " DATABASE_URL
read -p "Entrez votre RENDER_API_KEY (optionnel - laisser vide pour ignorer): " RENDER_API_KEY
read -p "Entrez votre SERVICE_ID Render (ex: srv-xxxxx): " RENDER_SERVICE_ID
read -p "Entrez votre VERCEL_TOKEN (optionnel - laisser vide pour ignorer): " VERCEL_TOKEN

# Créer bucket sur Supabase
SUPABASE_URL="https://xjnnzdkmhzmeocfepbxq.supabase.co"

echo ""
echo "[1/3] Création du bucket 'videos' sur Supabase..."
BUCKET_RESPONSE=$(curl -s -X POST "$SUPABASE_URL/storage/v1/b" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name":"videos","public":true}')

if echo "$BUCKET_RESPONSE" | grep -q '"name":"videos"'; then
  echo "✓ Bucket créé ou déjà existant."
elif echo "$BUCKET_RESPONSE" | grep -q "already exists"; then
  echo "✓ Bucket 'videos' déjà existant."
else
  echo "Réponse Supabase: $BUCKET_RESPONSE"
  echo "⚠ Bucket création possiblement échouée. Vérifiez votre clé."
fi

# Configurer Render envs
if [ -n "$RENDER_API_KEY" ] && [ -n "$RENDER_SERVICE_ID" ]; then
  echo ""
  echo "[2/3] Configuration des variables Render..."
  
  ENV_VARS="[
    {\"key\":\"DATABASE_URL\",\"value\":\"$DATABASE_URL\",\"secure\":true},
    {\"key\":\"DB_USE_SQLITE\",\"value\":\"false\",\"secure\":false},
    {\"key\":\"SUPABASE_URL\",\"value\":\"$SUPABASE_URL\",\"secure\":false},
    {\"key\":\"SUPABASE_SERVICE_ROLE_KEY\",\"value\":\"$SUPABASE_SERVICE_ROLE_KEY\",\"secure\":true},
    {\"key\":\"SUPABASE_ANON_KEY\",\"value\":\"$SUPABASE_ANON_KEY\",\"secure\":false},
    {\"key\":\"SUPABASE_BUCKET\",\"value\":\"videos\",\"secure\":false},
    {\"key\":\"NODE_ENV\",\"value\":\"production\",\"secure\":false}
  ]"
  
  PATCH_RESPONSE=$(curl -s -X PATCH "https://api.render.com/v1/services/$RENDER_SERVICE_ID/env-vars" \
    -H "Authorization: Bearer $RENDER_API_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"envVars\":$ENV_VARS}")
  
  if echo "$PATCH_RESPONSE" | grep -q "error"; then
    echo "⚠ Erreur lors de la mise à jour Render: $PATCH_RESPONSE"
  else
    echo "✓ Variables Render mises à jour."
  fi
else
  echo ""
  echo "[2/3] Configuration Render (manuel)"
  echo "Vous pouvez mettre à jour les variables Render manuellement:"
  echo "  - Render Dashboard > votre service > Environment"
  echo "  - Ajoutez/modifiez:"
  echo "    DATABASE_URL=$DATABASE_URL"
  echo "    DB_USE_SQLITE=false"
  echo "    SUPABASE_URL=$SUPABASE_URL"
  echo "    SUPABASE_SERVICE_ROLE_KEY=<votre clé>"
  echo "    SUPABASE_ANON_KEY=<votre clé>"
  echo "    SUPABASE_BUCKET=videos"
fi

# Configurer Vercel envs
if [ -n "$VERCEL_TOKEN" ]; then
  echo ""
  echo "[3/3] Configuration des variables Vercel..."
  
  read -p "Entrez votre PROJECT_ID Vercel (ex: prj_xxxxx): " VERCEL_PROJECT_ID
  
  VERCEL_ENVS="[
    {\"key\":\"NEXT_PUBLIC_SUPABASE_URL\",\"value\":\"$SUPABASE_URL\",\"target\":[\"production\",\"preview\",\"development\"]},
    {\"key\":\"NEXT_PUBLIC_SUPABASE_ANON_KEY\",\"value\":\"$SUPABASE_ANON_KEY\",\"target\":[\"production\",\"preview\",\"development\"]},
    {\"key\":\"NEXT_PUBLIC_SUPABASE_BUCKET\",\"value\":\"videos\",\"target\":[\"production\",\"preview\",\"development\"]}
  ]"
  
  for env in "${VERCEL_ENVS[@]}"; do
    curl -s -X POST "https://api.vercel.com/v10/projects/$VERCEL_PROJECT_ID/env" \
      -H "Authorization: Bearer $VERCEL_TOKEN" \
      -H "Content-Type: application/json" \
      -d "$env" > /dev/null
  done
  
  echo "✓ Variables Vercel mises à jour."
else
  echo ""
  echo "[3/3] Configuration Vercel (manuel)"
  echo "Vous pouvez mettre à jour les variables Vercel manuellement:"
  echo "  - Vercel Dashboard > votre projet > Settings > Environment Variables"
  echo "  - Ajoutez:"
  echo "    NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL"
  echo "    NEXT_PUBLIC_SUPABASE_ANON_KEY=<votre anon key>"
  echo "    NEXT_PUBLIC_SUPABASE_BUCKET=videos"
fi

echo ""
echo "✓ Configuration terminée!"
echo "Prochaines étapes:"
echo "  1. Redéployer le service Render (Manual Deploy ou git push)"
echo "  2. Redéployer le frontend Vercel"
echo "  3. Vérifier que les uploads fonctionnent"
