/**
 * Upload a simple Next.js SVG avatar to R2 defaults/nextjs-avatar.svg
 * Usage: node scripts/uploadDefaultAvatar.js
 */

const fs = require('fs');
const path = require('path');
const r2 = require('../services/r2');

async function main() {
  try {
    // Simple SVG avatar (Next.js mark)
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
  <rect width="100%" height="100%" fill="#000000" />
  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="72" fill="#ffffff">NEXT</text>
</svg>`;

    const tmp = path.join(process.cwd(), 'tmp');
    if (!fs.existsSync(tmp)) fs.mkdirSync(tmp);
    const filePath = path.join(tmp, 'nextjs-avatar.svg');
    fs.writeFileSync(filePath, svg, 'utf8');

    const key = 'defaults/nextjs-avatar.svg';
    const url = await r2.uploadFile(filePath, key, 'image/svg+xml');
    console.log('Uploaded default avatar to:', url);
    fs.unlinkSync(filePath);
  } catch (err) {
    console.error('Failed to upload default avatar:', err.message);
    process.exit(1);
  }
}

main();
