/**
 * Set default avatar URL for existing users with no avatar
 * Usage: node scripts/setDefaultAvatars.js
 */

require('dotenv').config();
const { connectDB } = require('../config/database');
const { User } = require('../models');

async function main() {
  try {
    await connectDB();
    const defaultAvatar = process.env.DEFAULT_AVATAR_URL || 'https://pub-077976fc48264565ba11341176cf6932.r2.dev/defaults/nextjs-avatar.svg';

    const [updated] = await User.update({ avatar: defaultAvatar }, {
      where: {
        avatar: null
      }
    });

    console.log(`Updated ${updated} users with default avatar.`);
    process.exit(0);
  } catch (err) {
    console.error('Error setting default avatars:', err.message);
    process.exit(1);
  }
}

main();
