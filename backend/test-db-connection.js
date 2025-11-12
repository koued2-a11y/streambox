const { connectDB } = require('./config/database');

async function testConnection() {
  try {
    await connectDB();
    console.log('✅ Connexion à la base de données réussie !');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur de connexion :', error.message);
    process.exit(1);
  }
}

testConnection();