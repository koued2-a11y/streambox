@echo off
echo 🚀 Démarrage de StreamBox...
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js n'est pas installé.
    pause
    exit /b 1
)

echo ✅ Node.js installé
echo.

if not exist "backend\node_modules" (
    echo 📦 Installation des dépendances backend...
    cd backend
    call npm install
    cd ..
)

if not exist "frontend\node_modules" (
    echo 📦 Installation des dépendances frontend...
    cd frontend
    call npm install
    cd ..
)

if not exist "backend\uploads\videos" (
    echo 📁 Création du dossier uploads...
    mkdir backend\uploads\videos
    mkdir backend\uploads\thumbnails
)

echo.
echo 🎬 Démarrage du backend sur http://localhost:5000
start "StreamBox Backend" cmd /k "cd backend && npm run dev"

timeout /t 3 /nobreak >nul

echo 🎨 Démarrage du frontend sur http://localhost:3000
start "StreamBox Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ✨ StreamBox est démarré !
echo.
echo 📡 Backend : http://localhost:5000
echo 🌐 Frontend : http://localhost:3000
echo.
pause

