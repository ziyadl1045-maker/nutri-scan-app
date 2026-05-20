import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const TOKEN = process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
const OWNER = 'ziyadl1045-maker';
const REPO = 'nutriscan';
const BASE = '/home/runner/workspace';
const API = 'https://api.github.com';
const HEADERS = {
  'Authorization': `Bearer ${TOKEN}`,
  'Content-Type': 'application/json',
  'Accept': 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
};

const sleep = ms => new Promise(r => setTimeout(r, ms));

// Files missing from GitHub (from previous check)
const missing = [
  '.github/workflows/build-apk.yml',
  '.github/workflows/build-release.yml',
  '.github/workflows/generate-keystore.yml',
  'client/src/pages/Chat.tsx',
  'client/src/pages/Dashboard.tsx',
  'client/src/pages/Landing.tsx',
  'client/src/pages/ProductDetails.tsx',
  'client/src/pages/Profile.tsx',
  'client/src/pages/Scan.tsx',
  'client/src/pages/not-found.tsx',
  'components.json',
  'drizzle.config.ts',
  'package-lock.json',
  'package.json',
  'postcss.config.js',
  'replit.md',
  'script/build.ts',
  'server/db.ts',
  'server/index.ts',
  'server/replit_integrations/audio/client.ts',
  'server/replit_integrations/audio/index.ts',
  'server/replit_integrations/audio/routes.ts',
  'server/replit_integrations/auth/index.ts',
  'server/replit_integrations/auth/replitAuth.ts',
  'server/replit_integrations/auth/routes.ts',
  'server/replit_integrations/auth/storage.ts',
  'server/replit_integrations/batch/index.ts',
  'server/replit_integrations/batch/utils.ts',
  'server/replit_integrations/chat/index.ts',
  'server/replit_integrations/chat/routes.ts',
  'server/replit_integrations/chat/storage.ts',
  'server/replit_integrations/image/client.ts',
  'server/replit_integrations/image/index.ts',
  'server/replit_integrations/image/routes.ts',
  'server/routes.ts',
  'server/seeds/moroccan_products.ts',
  'server/static.ts',
  'server/storage.ts',
  'server/vite.ts',
  'shared/models/auth.ts',
  'shared/models/chat.ts',
  'shared/models/moroccan_products.ts',
  'shared/routes.ts',
  'shared/schema.ts',
  'tailwind.config.ts',
  'tsconfig.json',
  'vite.config.ts',
];

let ok = 0, fail = 0;

for (const file of missing) {
  const fullPath = path.join(BASE, file);
  let content;
  try { content = fs.readFileSync(fullPath).toString('base64'); }
  catch { console.warn(`Skip: ${file}`); continue; }

  // Try PUT directly
  const url = `${API}/repos/${OWNER}/${REPO}/contents/${file}`;
  let res = await fetch(url, {
    method: 'PUT', headers: HEADERS,
    body: JSON.stringify({ message: `add ${file}`, content }),
  });
  let data = await res.json();

  if (res.status === 201 || res.status === 200) {
    ok++; continue;
  }

  // If file exists (422), get SHA and update
  if (res.status === 422) {
    const getRes = await fetch(url, { headers: HEADERS });
    if (getRes.ok) {
      const existing = await getRes.json();
      if (existing.sha) {
        res = await fetch(url, {
          method: 'PUT', headers: HEADERS,
          body: JSON.stringify({ message: `update ${file}`, content, sha: existing.sha }),
        });
        data = await res.json();
        if (res.status === 200 || res.status === 201) { ok++; continue; }
      }
    }
  }

  console.warn(`❌ ${file}: ${res.status} ${data.message?.slice(0,60)}`);
  fail++;
  await sleep(300);
}

console.log(`\n✅ ${ok} pushed, ❌ ${fail} failed`);
console.log(`🔗 https://github.com/${OWNER}/${REPO}`);
