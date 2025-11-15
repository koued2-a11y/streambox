const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

function createClientInstance() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
  }
  return createClient(url, key, {
    auth: { persistSession: false }
  });
}

async function uploadFile(localPath, key, contentType) {
  const sb = createClientInstance();
  const bucket = process.env.SUPABASE_BUCKET || 'videos';

  // Read file as buffer
  const buffer = fs.readFileSync(localPath);

  // Ensure key does not start with a leading slash
  const normalizedKey = String(key).replace(/^\/+/, '');

  // Upload buffer
  const { error } = await sb.storage.from(bucket).upload(normalizedKey, buffer, {
    contentType: contentType || 'application/octet-stream',
    upsert: false
  });

  if (error) {
    throw error;
  }

  // Get public URL (you may want to use signed URLs for private buckets)
  const { publicURL } = sb.storage.from(bucket).getPublicUrl(normalizedKey);
  return publicURL;
}

module.exports = {
  uploadFile
};
