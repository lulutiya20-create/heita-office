const fs = require('fs');
const READ_KEY = '$2a$10$Htgjeu92rse90o7hAgF4V.G7dneKS6l6ylY8xOF92YOqzRb/COAp2';

async function fetchRetry(url, opts, tries = 3) {
  for (let i = 1; i <= tries; i++) {
    try { return await fetch(url, opts); }
    catch (e) { await new Promise(r => setTimeout(r, 2000)); }
  }
  throw new Error('网络失败: ' + url);
}

async function main() {
  // ① 确认 102 人已持久化
  let r = await fetchRetry('https://api.jsonbin.io/v3/b/6a2d8016f5f4af5e29ec2a66/latest', {
    headers: { 'X-Access-Key': READ_KEY, 'X-Bin-Meta': 'false' }
  });
  const app = (await r.json());
  console.log('读回 members:', app.members.length);

  // ② 修复被回滚的图片 URL (按昨天 mapping.json: png→jpg, picsum→mentor-*.jpg)
  const mapping = JSON.parse(fs.readFileSync('C:/Users/Administrator/WorkBuddy/2026-06-12-18-25-30/_imgconv/mapping.json', 'utf8'));
  const list = Array.isArray(mapping) ? mapping : (mapping.mappings || mapping.items || Object.values(mapping).flat());
  let fixed = 0;
  const walk = (obj) => {
    if (typeof obj === 'string') return;
    if (Array.isArray(obj)) { obj.forEach(walk); return; }
    if (obj && typeof obj === 'object') {
      for (const k of Object.keys(obj)) {
        if (typeof obj[k] === 'string') {
          for (const m of list) {
            if (m.from && obj[k] === m.from) { obj[k] = m.to; fixed++; break; }
          }
        } else walk(obj[k]);
      }
    }
  };
  walk(app);
  console.log('③ 修复图片链接', fixed, '处');
  if (fixed > 0) {
    const MASTER_KEY = JSON.parse(fs.readFileSync('C:/Users/Administrator/WorkBuddy/2026-06-12-18-25-30/_imgconv/keys.json', 'utf8')).masterKey;
    r = await fetchRetry('https://api.jsonbin.io/v3/b/6a2d8016f5f4af5e29ec2a66', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'X-Master-Key': MASTER_KEY },
      body: JSON.stringify(app)
    });
    console.log('④ PUT status:', r.status);
    // 再读回终验
    r = await fetchRetry('https://api.jsonbin.io/v3/b/6a2d8016f5f4af5e29ec2a66/latest', {
      headers: { 'X-Access-Key': READ_KEY, 'X-Bin-Meta': 'false' }
    });
    const fin = await r.json();
    console.log('⑤ 终验: members=', fin.members.length, '| 残留旧png链接=', JSON.stringify(fin).includes('.png') ? '有(检查详情)' : '0', '| 残留picsum=', JSON.stringify(fin).includes('picsum.photos') ? '有' : '0');
    const pngDetail = [];
    const scan = (o, p) => {
      if (typeof o === 'string') { if (o.includes('picsum.photos') || /cdn\.jsdelivr\.net.*\.png/.test(o)) pngDetail.push(p + '=' + o.slice(0, 80)); return; }
      if (Array.isArray(o)) o.forEach((x, i) => scan(x, p + '[' + i + ']'));
      else if (o && typeof o === 'object') Object.keys(o).forEach(k => scan(o[k], p + '.' + k));
    };
    scan(fin, '');
    pngDetail.slice(0, 20).forEach(d => console.log('  -', d));
  }
}
main().catch(e => console.log('err', e.message));
