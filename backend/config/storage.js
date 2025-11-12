const path = require('path');

module.exports = {
  // Configuration du serveur de stockage (PC2)
  storageServer: {
    host: '192.168.137.1',
    videoStoragePath: '\\\\DESKTOP-5V36P9T\\videos', // Chemin réseau vers le dossier partagé
    alternativePath: '\\\\192.168.137.1\\videos', // Chemin alternatif par IP
    useModernSMB: true, // Utiliser SMB 3.0 pour Windows 11
    tempUploadDir: path.join(process.cwd(), 'temp-uploads'),
    maxFileSize: 1024 * 1024 * 1024 * 2, // 2GB max par fichier
    allowedTypes: ['video/mp4', 'video/webm', 'video/quicktime'],
    // Configurations de connexion au partage réseau
    share: {
      username: process.env.STORAGE_USER || 'storage_user',
      password: process.env.STORAGE_PASSWORD || 'your_password',
      domain: process.env.STORAGE_DOMAIN || 'WORKGROUP'
    }
  },

  // Configuration du traitement des vidéos
  videoProcessing: {
    maxConcurrent: 2,
    outputFormats: ['mp4'],
    thumbnailTime: '00:00:02',
    qualities: {
      high: { height: 1080, bitrate: '4000k' },
      medium: { height: 720, bitrate: '2500k' },
      low: { height: 480, bitrate: '1000k' }
    }
  }
};