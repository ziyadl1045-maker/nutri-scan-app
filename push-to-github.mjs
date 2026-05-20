import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const TOKEN = process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
const OWNER = 'ziyadl1045-maker';
const REPO = 'nutriscan';
const BASE = '/home/runner/workspace';
const API = 'https://api.github.com';

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function putFile(filePath, content64, retries = 3) {
  // Don't encode slashes — GitHub Contents API expects raw path
  const url = `${API}/repos/${OWNER}/${REPO}/contents/${filePath}`;
  const headers = {
    'Authorization': `Bearer ${TOKEN}`,
    'Content-Type': 'application/json',
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };

  for (let i = 0; i < retries; i++) {
    // Check if file exists to get SHA
    let existingSha = null;
    const getRes = await fetch(url, { headers });
    if (getRes.ok) {
      const existing = await getRes.json();
      existingSha = existing.sha || null;
    }

    const body = { message: `add ${filePath}`, content: content64 };
    if (existingSha) body.sha = existingSha;

    const res = await fetch(url, {
      method: 'PUT', headers,
      body: JSON.stringify(body),
    });
    const data = await res.json();

    if (res.status === 201 || res.status === 200) return { ok: true };
    if (res.status === 403 && data.message?.includes('rate limit')) {
      console.log(`  Rate limit, waiting 45s...`);
      await sleep(45000);
      continue;
    }
    return { ok: false, msg: `${res.status}: ${data.message?.slice(0, 60)}` };
  }
  return { ok: false, msg: 'max retries' };
}

const files = execSync(
  `git -C ${BASE} ls-files | grep -v "attached_assets/.*\\.zip" | grep -v "attached_assets/unzipped" | grep -v "attached_assets/generated_images" | grep -v "push-to-github.mjs"`,
  { encoding: 'utf8' }
).trim().split('\n').filter(Boolean);

console.log(`Files to push: ${files.length}`);
let success = 0, failed = 0;

for (let i = 0; i < files.length; i++) {
  const file = files[i];
  const fullPath = path.join(BASE, file);
  let content;
  try { content = fs.readFileSync(fullPath).toString('base64'); }
  catch { continue; }

  const result = await putFile(file, content);
  if (result.ok) success++;
  else { console.warn(`❌ ${file}: ${result.msg}`); failed++; }

  if ((i + 1) % 20 === 0) {
    console.log(`  ${i + 1}/${files.length} — ✅ ${success} ❌ ${failed}`);
    await sleep(500);
  }
}

console.log(`\n✅ ${success} fichiers poussés, ❌ ${failed} échoués`);
console.log(`🔗 https://github.com/${OWNER}/${REPO}`);
