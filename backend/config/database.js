const { Sequelize } = require('sequelize');
require('dotenv').config();

// If DB_HOST (or DB_NAME) is not provided, fallback to SQLite for easy deployments
let sequelize;
if (!process.env.DB_HOST && !process.env.DB_NAME && process.env.DB_USE_SQLITE !== 'false') {
  const storagePath = process.env.DB_STORAGE || './database.sqlite';
  console.log('ℹ️ No remote DB configured — using SQLite fallback at', storagePath);
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: storagePath,
    logging: false
  });
} else {
  sequelize = new Sequelize({
    database: process.env.DB_NAME || 'kda_boost_db',
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 3306,
    dialect: 'mysql',
    logging: false,
    pool: {
      max: 10,
      min: 0,
      acquire: 60000,
      idle: 10000
    },
    dialectOptions: {
      connectTimeout: 60000,
    }
  });
}

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connecté à la base via Sequelize !');
    await sequelize.sync({ alter: true });
    return true;
  } catch (error) {
    console.error('❌ Impossible de se connecter à la base :', error);
    if (!process.env.DB_HOST && !process.env.DB_NAME) {
      console.error('Note: using SQLite fallback, check file permissions and path.');
    } else {
      console.error('Vérifiez que :');
      console.error("1. La base distante est joignable et en cours d'exécution");
      console.error('2. Les identifiants de connexion sont corrects');
      console.error('3. La base de données existe');
    }
    throw error;
  }
};

module.exports = { sequelize, connectDB };
