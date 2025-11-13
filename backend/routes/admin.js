const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { connectDB } = require('../config/database');
const { User } = require('../models');
let r2client = null;
try { r2client = require('../services/r2'); } catch (e) { r2client = null; }
const { auth } = require('../middleware/auth');

// Middleware: allow request if x-admin-run-secret matches ADMIN_RUN_SECRET, otherwise require auth
function secretOrAuth(req, res, next) {
  const provided = req.get('x-admin-run-secret');
  if (process.env.ADMIN_RUN_SECRET && provided && provided === process.env.ADMIN_RUN_SECRET) {
    // mark as admin
    req.user = { id: 0, username: 'admin-run', role: 'admin' };
    return next();
  }
  // fallback to normal auth
  return auth(req, res, next);
}

// POST /api/admin/run-avatar-scripts
// Upload default avatar to R2 (if configured) and set avatar URL for users with null avatar
router.post('/run-avatar-scripts', secretOrAuth, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') return res.status(403).json({ message: 'Admin required' });

    // Upload avatar to R2 if available
    let publicUrl = process.env.DEFAULT_AVATAR_URL || null;
    if (r2client && process.env.R2_BUCKET_NAME) {
      // create SVG in-memory and upload via r2 service
      const svg = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">\n  <rect width="100%" height="100%" fill=\"#000000\" />\n  <text x=\"50%\" y=\"50%\" dominant-baseline=\"middle\" text-anchor=\"middle\" font-family=\"Arial, Helvetica, sans-serif\" font-size=\"72\" fill=\"#ffffff\">NEXT</text>\n</svg>`;
      const tmpDir = path.join(process.cwd(), 'tmp');
      if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);
      const filePath = path.join(tmpDir, 'nextjs-avatar.svg');
      fs.writeFileSync(filePath, svg, 'utf8');
      const key = 'defaults/nextjs-avatar.svg';
      try {
        const url = await r2client.uploadFile(filePath, key, 'image/svg+xml');
        publicUrl = process.env.DEFAULT_AVATAR_URL || url;
      } catch (err) {
        console.error('R2 upload failed:', err.message || err);
      } finally {
        try { fs.unlinkSync(filePath); } catch (e) {}
      }
    }

    // Connect DB and update users
    await connectDB();
    const defaultAvatar = publicUrl || (process.env.DEFAULT_AVATAR_URL || null);
    if (!defaultAvatar) {
      return res.status(500).json({ message: 'No default avatar URL available' });
    }

    const [updated] = await User.update({ avatar: defaultAvatar }, {
      where: { avatar: null }
    });

    res.json({ status: 'OK', uploadedAvatarUrl: defaultAvatar, updatedUsers: updated });
  } catch (err) {
    console.error('Error running avatar scripts:', err);
    res.status(500).json({ message: 'Internal error', error: err.message });
  }
});

module.exports = router;
