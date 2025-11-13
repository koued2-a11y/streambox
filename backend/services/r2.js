const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

function createClient() {
  if (!process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY || !process.env.R2_ACCOUNT_ID) {
    throw new Error('R2 credentials (R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_ACCOUNT_ID) are required');
  }

  return new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
    forcePathStyle: false,
  });
}

async function uploadFile(localPath, key, contentType) {
  const client = createClient();
  const body = fs.createReadStream(localPath);

  const params = {
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
    Body: body,
    ContentType: contentType || 'application/octet-stream'
  };

  await client.send(new PutObjectCommand(params));

  // Public URL pattern: https://{bucket}.{account_id}.r2.cloudflarestorage.com/{key}
  const bucket = process.env.R2_BUCKET_NAME;
  const account = process.env.R2_ACCOUNT_ID;
  const publicUrl = `https://${bucket}.${account}.r2.cloudflarestorage.com/${encodeURIComponent(key)}`;
  return publicUrl;
}

module.exports = {
  uploadFile
};
