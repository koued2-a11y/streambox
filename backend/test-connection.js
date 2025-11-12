const { sequelize } = require('./config/database');

async function testConnection() {
    try {
        await sequelize.authenticate();
        console.log('✅ Connexion à la base de données réussie !');
        process.exit(0);
    } catch (error) {
        console.error('❌ Erreur de connexion :', error.message);
        process.exit(1);
    }
}

testConnection();