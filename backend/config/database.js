const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize({
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

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connecté à MySQL via Sequelize !');
    await sequelize.sync({ alter: true });
    return true;
  } catch (error) {
    console.error('❌ Impossible de se connecter à MySQL :', error);
    console.error('Vérifiez que :');
    console.error("1. MySQL est bien installé et en cours d'exécution");
    console.error('2. Les identifiants de connexion sont corrects');
    console.error('3. La base de données existe');
    throw error;
  }
};

module.exports = { sequelize, connectDB };
