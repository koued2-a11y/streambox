const { Sequelize } = require('sequelize');
require('dotenv').config();

// Support multiple deployment patterns:
// - Prefer `DATABASE_URL` if provided (single connection string)
// - Else use explicit DB_* env vars (DB_DIALECT can be set to 'mysql' or 'postgres')
// - Fallback to SQLite for quick local testing when DB_HOST/DB_NAME not provided
let sequelize;
const dialect = process.env.DB_DIALECT || 'mysql';
if (process.env.DATABASE_URL) {
  // Use a single connection string (works with Heroku/Render/Supabase/PlanetScale)
  // Auto-detect dialect from DATABASE_URL or use 'postgres' for Supabase
  const dialectFromUrl = process.env.DATABASE_URL.startsWith('postgres') ? 'postgres' : dialect;
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: dialectFromUrl,
    logging: false,
    pool: {
      max: Number(process.env.DB_POOL_MAX) || 10,
      min: Number(process.env.DB_POOL_MIN) || 0,
      acquire: Number(process.env.DB_POOL_ACQUIRE) || 60000,
      idle: Number(process.env.DB_POOL_IDLE) || 10000,
    },
    dialectOptions: {
      connectTimeout: Number(process.env.DB_CONNECT_TIMEOUT) || 60000,
    }
  });
} else if (!process.env.DB_HOST && !process.env.DB_NAME && process.env.DB_USE_SQLITE !== 'false') {
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
    port: Number(process.env.DB_PORT) || (dialect === 'postgres' ? 5432 : 3306),
    dialect: dialect,
    logging: false,
    pool: {
      max: Number(process.env.DB_POOL_MAX) || 10,
      min: Number(process.env.DB_POOL_MIN) || 0,
      acquire: Number(process.env.DB_POOL_ACQUIRE) || 60000,
      idle: Number(process.env.DB_POOL_IDLE) || 10000,
    },
    dialectOptions: {
      connectTimeout: Number(process.env.DB_CONNECT_TIMEOUT) || 60000,
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
