// 批量图片转换: PNG -> 高质量 JPEG (q92 mozjpeg 4:4:4)
// 规则: 跳过已是 JPEG 的文件; 跳过带透明通道的图; 仅当原图>150KB 且压缩收益>25% 才上传
// 原 PNG 文件保留在仓库中不删除 (可回退)
const fs = require('fs');
const sharp = require('C:/Users/Administrator/.workbuddy/binaries/node/workspace/node_modules/sharp');

const ROOT = 'C:/Users/Administrator/WorkBuddy/2026-06-12-18-25-30';
const keys = JSON.parse(fs.readFileSync(ROOT + '/_imgconv/keys.json', 'utf8'));
const REPO = 'lulutiya20-create/heita-office-images';
const CDN = 'https://cdn.jsdelivr.net/gh/' + REPO + '@main/';
const JSONBIN_BIN = '6a2d8016f5f4af5e29ec2a66';
const JSONBIN_READ = '$2a$10$Htgjeu92rse90o7hAgF4V.G7dneKS6l6ylY8xOF92YOqzRb/COAp2';

const log = (...a) => console.log(new Date().toTimeString().slice(0, 8), ...a);

async function fetchRetry(url, opts = {}, tries = 4, delayMs = 8000) {
  for (let i = 1; i <= tries; i++) {
    try { return await fetch(url, opts); }
    catch (e) {
      if (i === tries) throw e;
      log(`  重试 ${i}/${tries - 1} (${e.message}), ${delayMs / 1000}s 后重试...`);
      await new Promise(s => setTimeout(s, delayMs));
    }
  }
}

async function ghDownload(repoPath) {
  const r = await fetchRetry(`https://api.github.com/repos/${REPO}/contents/${repoPath}?ref=main`, {
    headers: { Authorization: 'token ' + keys.ghToken, 'User-Agent': 'imgconv', Accept: 'application/vnd.github.raw' },
    signal: AbortSignal.timeout(120000)
  });
  if (!r.ok) throw new Error('download ' + r.status);
  return Buffer.from(await r.arrayBuffer());
}

async function ghUpload(repoPath, buf, message) {
  const r = await fetch(`https://api.github.com/repos/${REPO}/contents/${repoPath}`, {
    method: 'PUT',
    headers: { Authorization: 'token ' + keys.ghToken, 'User-Agent': 'imgconv', 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, content: buf.toString('base64'), branch: 'main' }),
    signal: AbortSignal.timeout(120000)
  });
  if (!r.ok) { const t = await r.text(); throw new Error('upload ' + r.status + ' ' + t.slice(0, 200)); }
  return r.json();
}

async function convertOne(repoPath, srcLabel) {
  let buf;
  try { buf = await ghDownload(repoPath); }
  catch (e) { log('  ⚠️ 下载失败', repoPath, e.message); return null; }
  const origSize = buf.length;
  let meta;
  try { meta = await sharp(buf).metadata(); }
  catch (e) { log('  ⚠️ 解析失败', repoPath, e.message); return null; }
  if (meta.format === 'jpeg') { log('  ↩ 已是JPEG, 跳过', repoPath, (origSize/1024/1024).toFixed(2)+'MB'); return null; }
  const stats = await sharp(buf).stats();
  if (!stats.isOpaque) { log('  ↩ 含透明通道, 保留PNG', repoPath); return null; }
  if (origSize < 150 * 1024) { log('  ↩ 太小(<150KB), 跳过', repoPath); return null; }
  const jpg = await sharp(buf).jpeg({ quality: 92, mozjpeg: true, chromaSubsampling: '4:4:4' }).toBuffer();
  const gain = 1 - jpg.length / origSize;
  if (gain < 0.25) { log('  ↩ 收益不足25%, 跳过', repoPath, (origSize/1024).toFixed(0)+'KB -> '+(jpg.length/1024).toFixed(0)+'KB'); return null; }
  const newPath = repoPath.replace(/\.(png|webp)$/i, '.jpg');
  await ghUpload(newPath, jpg, 'perf: convert ' + repoPath + ' to JPEG q92 (' + (origSize/1024/1024).toFixed(1) + 'MB -> ' + (jpg.length/1024/1024).toFixed(1) + 'MB)');
  log('  ✅', repoPath, (origSize/1024/1024).toFixed(2)+'MB -> '+(jpg.length/1024/1024).toFixed(2)+'MB ('+(gain*100).toFixed(0)+'%省)');
  return { from: CDN + repoPath, to: CDN + newPath, fromSize: origSize, toSize: jpg.length, src: srcLabel };
}

(async () => {
  // 1. 拉最新云端数据
  log('拉取 JSONBin 最新数据...');
  const gr = await fetchRetry(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN}/latest`, {
    headers: { 'X-Access-Key': JSONBIN_READ }, signal: AbortSignal.timeout(60000)
  });
  const cloud = (await gr.json()).record;
  log('成员', cloud.members.length, '导师', cloud.mentors.length, '轮播', cloud.carouselImages.length, '事件', cloud.events.length);

  // 2. 收集所有仓库内图片路径
  const repoPaths = new Set();
  (cloud.carouselImages || []).forEach(c => { const u = c.url || c.src; if (u && u.startsWith(CDN)) repoPaths.add(u.slice(CDN.length)); });
  (cloud.mentors || []).forEach(m => { if (m.image && m.image.startsWith(CDN)) repoPaths.add(m.image.slice(CDN.length)); });
  (cloud.members || []).forEach(m => { if (m.avatar && m.avatar.startsWith(CDN)) repoPaths.add(m.avatar.slice(CDN.length)); });
  (cloud.events || []).forEach(e => { if (e.image && e.image.startsWith(CDN)) repoPaths.add(e.image.slice(CDN.length)); });
  log('仓库内待处理图片:', repoPaths.size, '个');

  // 3. 逐个转换
  const mapping = [];
  for (const p of repoPaths) {
    log('处理:', p);
    const r = await convertOne(p, 'repo');
    if (r) mapping.push(r);
  }

  // 4. picsum 占位导师图 -> 转存到 GitHub
  const picUrls = new Set();
  (cloud.mentors || []).forEach(m => { if (m.image && m.image.includes('picsum.photos')) picUrls.add(m.image); });
  for (const u of picUrls) {
    log('处理占位图:', u);
    try {
      const r = await fetch(u, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(30000) });
      if (!r.ok) throw new Error(r.status);
      const buf = Buffer.from(await r.arrayBuffer());
      const jpg = await sharp(buf).jpeg({ quality: 92, mozjpeg: true }).toBuffer();
      const id = u.match(/seed\/([^/]+)/)[1];
      const newPath = 'mentors/' + id + '.jpg';
      await ghUpload(newPath, jpg, 'perf: replace picsum placeholder ' + id);
      mapping.push({ from: u, to: CDN + newPath, fromSize: buf.length, toSize: jpg.length, src: 'picsum' });
      log('  ✅ 占位图已转存', (buf.length/1024).toFixed(0)+'KB -> '+(jpg.length/1024).toFixed(0)+'KB');
    } catch (e) { log('  ⚠️ 占位图处理失败:', e.message); }
  }

  fs.writeFileSync(ROOT + '/_imgconv/mapping.json', JSON.stringify(mapping, null, 2));
  const totalFrom = mapping.reduce((a, b) => a + b.fromSize, 0);
  const totalTo = mapping.reduce((a, b) => a + b.toSize, 0);
  log('=== 转换完成:', mapping.length, '张,', (totalFrom/1024/1024).toFixed(1)+'MB ->', (totalTo/1024/1024).toFixed(1)+'MB ===');
})().catch(e => { console.error('FATAL:', e); process.exit(1); });
