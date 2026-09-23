// 重试第一轮下载失败的图片 (更长超时 + 更多重试)
const fs = require('fs');
const sharp = require('C:/Users/Administrator/.workbuddy/binaries/node/workspace/node_modules/sharp');

const ROOT = 'C:/Users/Administrator/WorkBuddy/2026-06-12-18-25-30';
const keys = JSON.parse(fs.readFileSync(ROOT + '/_imgconv/keys.json', 'utf8'));
const REPO = 'lulutiya20-create/heita-office-images';
const CDN = 'https://cdn.jsdelivr.net/gh/' + REPO + '@main/';

const FAILED = [
  'carousel/1781413705600.png',
  'carousel/1781413728100.png',
  'mentors/1781418206690904.png',
  'events/1781435333629.png'
];

const log = (...a) => console.log(new Date().toTimeString().slice(0, 8), ...a);

async function fetchRetry(url, opts = {}, tries = 5, delayMs = 10000) {
  for (let i = 1; i <= tries; i++) {
    try { return await fetch(url, opts); }
    catch (e) {
      if (i === tries) throw e;
      log(`  重试 ${i}/${tries - 1} (${e.message}), 等 ${delayMs / 1000}s...`);
      await new Promise(s => setTimeout(s, delayMs));
    }
  }
}

async function ghDownload(repoPath) {
  const r = await fetchRetry(`https://api.github.com/repos/${REPO}/contents/${repoPath}?ref=main`, {
    headers: { Authorization: 'token ' + keys.ghToken, 'User-Agent': 'imgconv', Accept: 'application/vnd.github.raw' },
    signal: AbortSignal.timeout(600000)
  });
  if (!r.ok) throw new Error('download ' + r.status);
  return Buffer.from(await r.arrayBuffer());
}

async function ghUpload(repoPath, buf, message) {
  const r = await fetchRetry(`https://api.github.com/repos/${REPO}/contents/${repoPath}`, {
    method: 'PUT',
    headers: { Authorization: 'token ' + keys.ghToken, 'User-Agent': 'imgconv', 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, content: buf.toString('base64'), branch: 'main' }),
    signal: AbortSignal.timeout(300000)
  });
  if (!r.ok) { const t = await r.text(); throw new Error('upload ' + r.status + ' ' + t.slice(0, 200)); }
  return r.json();
}

(async () => {
  const mappingFile = ROOT + '/_imgconv/mapping.json';
  const mapping = JSON.parse(fs.readFileSync(mappingFile, 'utf8'));
  const done = new Set(mapping.map(m => m.from));

  for (const p of FAILED) {
    if (done.has(CDN + p)) { log('已完成, 跳过:', p); continue; }
    log('重试:', p);
    try {
      const buf = await ghDownload(p);
      const origSize = buf.length;
      const meta = await sharp(buf).metadata();
      if (meta.format === 'jpeg') { log('  ↩ 已是JPEG, 跳过'); continue; }
      const stats = await sharp(buf).stats();
      if (!stats.isOpaque) { log('  ↩ 含透明通道, 保留PNG'); continue; }
      const jpg = await sharp(buf).jpeg({ quality: 92, mozjpeg: true, chromaSubsampling: '4:4:4' }).toBuffer();
      const gain = 1 - jpg.length / origSize;
      if (gain < 0.25) { log('  ↩ 收益不足, 跳过', (origSize/1024).toFixed(0)+'KB -> '+(jpg.length/1024).toFixed(0)+'KB'); continue; }
      const newPath = p.replace(/\.(png|webp)$/i, '.jpg');
      await ghUpload(newPath, jpg, 'perf: convert ' + p + ' to JPEG q92 (' + (origSize/1024/1024).toFixed(1) + 'MB -> ' + (jpg.length/1024/1024).toFixed(1) + 'MB)');
      mapping.push({ from: CDN + p, to: CDN + newPath, fromSize: origSize, toSize: jpg.length, src: 'repo-retry' });
      log('  ✅', p, (origSize/1024/1024).toFixed(2)+'MB -> '+(jpg.length/1024/1024).toFixed(2)+'MB ('+(gain*100).toFixed(0)+'%省)');
    } catch (e) { log('  ❌ 仍然失败:', p, e.message); }
  }

  fs.writeFileSync(mappingFile, JSON.stringify(mapping, null, 2));
  const totalFrom = mapping.reduce((a, b) => a + b.fromSize, 0);
  const totalTo = mapping.reduce((a, b) => a + b.toSize, 0);
  log('=== 累计:', mapping.length, '张,', (totalFrom/1024/1024).toFixed(1)+'MB ->', (totalTo/1024/1024).toFixed(1)+'MB ===');
})().catch(e => { console.error('FATAL:', e); process.exit(1); });
