/**
 * Script pour créer un utilisateur administrateur (Sequelize/MySQL)
 * Usage: node scripts/createAdmin.js
 */

require('dotenv').config();
const { UniqueConstraintError, Op } = require('sequelize');
const { sequelize, connectDB } = require('../config/database');
const { User } = require('../models');

async function createAdmin() {
  try {
    await connectDB();
    console.log('✅ Connecté à MySQL via Sequelize');

    const existingAdmin = await User.findOne({ where: { role: 'admin' } });
    if (existingAdmin) {
      console.log('⚠️  Un administrateur existe déjà:', existingAdmin.email);
      process.exit(0);
    }

    // Éviter les doublons email/username existants
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [
          { email: 'admin@streambox.com' },
          { username: 'admin' }
        ]
      }
    });
    if (existingUser) {
      console.log('⚠️  Un utilisateur avec email/username admin existe déjà:', existingUser.email);
      // Met à jour son rôle en admin si nécessaire
      if (existingUser.role !== 'admin') {
        existingUser.role = 'admin';
        await existingUser.save();
        console.log('🔁 Rôle mis à jour en administrateur pour:', existingUser.email);
      }
      process.exit(0);
    }

    const admin = await User.create({
      username: 'admin',
      email: 'admin@streambox.com',
      password: 'admin123', // hashé via hooks User.beforeCreate
      role: 'admin',
      avatar: null
    });

    console.log('✅ Administrateur créé avec succès !');
    console.log('📧 Email: admin@streambox.com');
    console.log('🔑 Mot de passe: admin123');
    console.log('⚠️  IMPORTANT: Changez ce mot de passe après la première connexion !');
    process.exit(0);
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      console.error('❌ Contrainte d’unicité violée (email/username déjà utilisés).');
    } else {
      console.error('❌ Erreur:', error.message);
    }
    process.exit(1);
  } finally {
    try { await sequelize.close(); } catch {}
  }
}

createAdmin();

