@echo off
echo Starting Streambox Server Setup...

:: Configuration pour Windows 11
echo Configuring network discovery and file sharing...
powershell -Command "Set-NetFirewallRule -DisplayGroup 'File and Printer Sharing' -Enabled True" >nul 2>&1
powershell -Command "Set-NetFirewallRule -DisplayGroup 'Network Discovery' -Enabled True" >nul 2>&1

:: Test des deux chemins d'accès possibles
echo Testing network share access...

:: Vérification de l'accès au partage réseau
if not exist "\\DESKTOP-5V36P9T\videos" (
    echo ERROR: Cannot access video share at \\DESKTOP-5V36P9T\videos
    echo Please check network sharing settings
    pause
    exit /b 1
)

:: Création des dossiers nécessaires
mkdir "\\DESKTOP-5V36P9T\videos\uploads" 2>nul
mkdir "\\DESKTOP-5V36P9T\videos\thumbnails" 2>nul
mkdir "\\DESKTOP-5V36P9T\videos\temp" 2>nul

:: Installation des dépendances Node.js si nécessaire
echo Installing dependencies...
cd /d "%~dp0"
call npm install

:: Configuration des variables d'environnement
set DB_HOST=192.168.137.1
set DB_PORT=3306
set DB_NAME=kda_boost_db
set DB_USER=kdauser
set DB_PASSWORD=Koued@2008
set STORAGE_PATH=\\DESKTOP-5V36P9T\videos
set VIDEO_PROCESSING_ENABLED=true

:: Démarrage du serveur
echo Starting Streambox server...
call npm start

pause