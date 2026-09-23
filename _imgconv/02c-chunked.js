// 大文件分块下载转换 (Range 请求, 单块重试, 支持断点续传)
const fs = require('fs');
const sharp = require('C:/Users/Administrator/.workbuddy/binaries/node/workspace/node_modules/sharp');

const ROOT = 'C:/Users/Administrator/WorkBuddy/2026-06-12-18-25-30';
const keys = JSON.parse(fs.readFileSync(ROOT + '/_imgconv/keys.json', 'utf8'));
const REPO = 'lulutiya20-create/heita-office-images';
const RAW = 'https://raw.githubusercontent.com/' + REPO + '/main/';
const CDN = 'https://cdn.jsdelivr.net/gh/' + REPO + '@main/';
const CHUNK = 2 * 1024 * 1024; // 2MB

const FAILED = [
  'carousel/1781413705600.png',
  'carousel/1781413728100.png',
  'events/1781435333629.png'
];

const log = (...a) => console.log(new Date().toTimeString().slice(0, 8), ...a);

// 分块下载: 每块独立重试
async function chunkedDownload(repoPath) {
  const url = RAW + repoPath;
  const UA = { 'User-Agent': 'Mozilla/5.0', Accept: '*/*' };
  // 先探测大小
  let total = 0;
  for (let i = 1; i <= 5; i++) {
    try {
      const r = await fetch(url, { headers: { ...UA, Range: 'bytes=0-0' }, signal: AbortSignal.timeout(30000), redirect: 'follow' });
      const cr = r.headers.get('content-range');
      if (cr) { total = parseInt(cr.split('/')[1]); break; }
      if (r.status === 200) { // 不支持 Range, 整体下载
        const buf = Buffer.from(await r.arrayBuffer());
        return buf;
      }
      throw new Error('probe ' + r.status);
    } catch (e) { if (i === 5) throw e; log(`  探测重试 ${i} (${e.message})`); await new Promise(s => setTimeout(s, 8000)); }
  }
  log('  文件大小:', (total / 1024 / 1024).toFixed(2), 'MB,', Math.ceil(total / CHUNK), '块');
  const parts = [];
  for (let start = 0; start < total; start += CHUNK) {
    const end = Math.min(start + CHUNK - 1, total - 1);
    let ok = false;
    for (let i = 1; i <= 6 && !ok; i++) {
      try {
        const r = await fetch(url, { headers: { ...UA, Range: `bytes=${start}-${end}` }, signal: AbortSignal.timeout(120000), redirect: 'follow' });
        if (!r.ok && r.status !== 206) throw new Error('chunk ' + r.status);
        const buf = Buffer.from(await r.arrayBuffer());
        if (buf.length !== end - start + 1) throw new Error('chunk size ' + buf.length + ' != ' + (end - start + 1));
        parts.push(buf);
        ok = true;
        log(`  块 ${Math.floor(start / CHUNK) + 1}/${Math.ceil(total / CHUNK)} ✅ (${(buf.length / 1024).toFixed(0)}KB)`);
      } catch (e) {
        if (i === 6) throw new Error(`块 ${start} 最终失败: ${e.message}`);
        log(`  块 ${Math.floor(start / CHUNK) + 1} 重试 ${i} (${e.message}), 等 5s...`);
        await new Promise(s => setTimeout(s, 5000));
      }
    }
  }
  return Buffer.concat(parts);
}

async function ghUpload(repoPath, buf, message) {
  for (let i = 1; i <= 3; i++) {
    try {
      const r = await fetch(`https://api.github.com/repos/${REPO}/contents/${repoPath}`, {
        method: 'PUT',
        headers: { Authorization: 'token ' + keys.ghToken, 'User-Agent': 'imgconv', 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, content: buf.toString('base64'), branch: 'main' }),
        signal: AbortSignal.timeout(300000)
      });
      if (!r.ok) { const t = await r.text(); throw new Error('upload ' + r.status + ' ' + t.slice(0, 150)); }
      return r.json();
    } catch (e) { if (i === 3) throw e; log('  上传重试 ' + i + ' (' + e.message + ')'); await new Promise(s => setTimeout(s, 8000)); }
  }
}

(async () => {
  const mappingFile = ROOT + '/_imgconv/mapping.json';
  const mapping = JSON.parse(fs.readFileSync(mappingFile, 'utf8'));
  const done = new Set(mapping.map(m => m.from));

  for (const p of FAILED) {
    if (done.has(CDN + p)) { log('已完成, 跳过:', p); continue; }
    log('分块下载:', p);
    try {
      const buf = await chunkedDownload(p);
      const origSize = buf.length;
      const meta = await sharp(buf).metadata();
      if (meta.format === 'jpeg') { log('  ↩ 已是JPEG, 跳过'); continue; }
      const stats = await sharp(buf).stats();
      if (!stats.isOpaque) { log('  ↩ 含透明通道, 保留PNG'); continue; }
      const jpg = await sharp(buf).jpeg({ quality: 92, mozjpeg: true, chromaSubsampling: '4:4:4' }).toBuffer();
      const gain = 1 - jpg.length / origSize;
      if (gain < 0.2) { log('  ↩ 收益不足, 跳过', (origSize/1024).toFixed(0)+'KB -> '+(jpg.length/1024).toFixed(0)+'KB'); continue; }
      const newPath = p.replace(/\.(png|webp)$/i, '.jpg');
      await ghUpload(newPath, jpg, 'perf: convert ' + p + ' to JPEG q92 (' + (origSize/1024/1024).toFixed(1) + 'MB -> ' + (jpg.length/1024/1024).toFixed(1) + 'MB)');
      mapping.push({ from: CDN + p, to: CDN + newPath, fromSize: origSize, toSize: jpg.length, src: 'repo-chunked' });
      log('  ✅', p, (origSize/1024/1024).toFixed(2)+'MB -> '+(jpg.length/1024/1024).toFixed(2)+'MB ('+(gain*100).toFixed(0)+'%省)');
    } catch (e) { log('  ❌ 失败:', p, e.message); }
    fs.writeFileSync(mappingFile, JSON.stringify(mapping, null, 2)); // 每张成功即保存
  }

  const totalFrom = mapping.reduce((a, b) => a + b.fromSize, 0);
  const totalTo = mapping.reduce((a, b) => a + b.toSize, 0);
  log('=== 累计:', mapping.length, '张,', (totalFrom/1024/1024).toFixed(1)+'MB ->', (totalTo/1024/1024).toFixed(1)+'MB ===');
})().catch(e => { console.error('FATAL:', e); process.exit(1); });
