#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function usage() {
  console.log(`Usage: node tools/upload_folder.js --dir <folder> --api <api_base_url> --email <admin_email> --password <admin_password> [--concurrency N]

Options:
  --dir        Directory containing video files
  --api        API base URL (example: https://streambox.onrender.com/api)
  --email      Admin email
  --password   Admin password
  --concurrency Number of parallel uploads (default 1)
`);
}

async function main() {
  const argv = require('minimist')(process.argv.slice(2));
  const dir = argv.dir || argv.d;
  const api = argv.api;
  const email = argv.email;
  const password = argv.password;
  const concurrency = Number(argv.concurrency || argv.c || 1);

  if (!dir || !api || !email || !password) {
    usage();
    process.exit(1);
  }

  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
    console.error('Directory not found:', dir);
    process.exit(1);
  }

  // login
  console.log('Authenticating...');
  let token;
  try {
    const resp = await axios.post(`${api.replace(/\/$/, '')}/auth/login`, { email, password });
    token = resp.data.token;
    if (!token) throw new Error('No token received');
  } catch (err) {
    console.error('Authentication failed:', err.response?.data || err.message);
    process.exit(1);
  }

  const allFiles = fs.readdirSync(dir).filter(f => {
    const ext = path.extname(f).toLowerCase();
    return ['.mp4', '.mov', '.webm', '.mkv', '.avi'].includes(ext);
  }).map(f => path.join(dir, f));

  console.log(`Found ${allFiles.length} video files to upload.`);
  if (!allFiles.length) process.exit(0);

  const results = [];

  for (let i = 0; i < allFiles.length; i++) {
    const filePath = allFiles[i];
    const base = path.basename(filePath, path.extname(filePath));
    // look for thumbnail file
    const thumbCandidates = ['.jpg', '.jpeg', '.png', '.webp'];
    let thumbPath = null;
    for (const ext of thumbCandidates) {
      const t = path.join(dir, base + ext);
      if (fs.existsSync(t)) { thumbPath = t; break; }
    }

    console.log(`Uploading [${i+1}/${allFiles.length}] ${path.basename(filePath)}${thumbPath ? ' (with thumbnail)' : ''}`);

    const form = new FormData();
    form.append('video', fs.createReadStream(filePath));
    if (thumbPath) form.append('thumbnail', fs.createReadStream(thumbPath));
    form.append('title', base);
    form.append('description', 'Uploaded via CLI');
    form.append('genre', 'Autre');

    let attempts = 0;
    let ok = false;
    let lastErr = null;
    while (attempts < 2 && !ok) {
      attempts += 1;
      try {
        const headers = { ...form.getHeaders(), Authorization: `Bearer ${token}` };
        const resp = await axios.post(`${api.replace(/\/$/, '')}/videos`, form, { headers, maxContentLength: Infinity, maxBodyLength: Infinity });
        console.log('  -> OK', resp.data?.message || 'uploaded');
        results.push({ file: filePath, ok: true });
        ok = true;
      } catch (err) {
        lastErr = err;
        console.error(`  -> Error attempt ${attempts}:`, err.response?.data || err.message);
        if (attempts < 2) await sleep(1000);
      }
    }
    if (!ok) {
      results.push({ file: filePath, ok: false, error: lastErr?.response?.data || lastErr?.message });
    }
    // small delay
    await sleep(300);
  }

  console.log('\nUpload summary:');
  const success = results.filter(r => r.ok).length;
  const failed = results.filter(r => !r.ok);
  console.log(`  Success: ${success}`);
  console.log(`  Failed: ${failed.length}`);
  if (failed.length) console.log('  Failed files:\n', failed.map(f => `${f.file} -> ${f.error}`).join('\n'));
}

main().catch(err => { console.error(err); process.exit(1); });
