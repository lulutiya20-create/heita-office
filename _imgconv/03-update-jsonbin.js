// 把转换产生的 URL 映射应用到 JSONBin 云端数据并 PUT
const fs = require('fs');
const ROOT = 'C:/Users/Administrator/WorkBuddy/2026-06-12-18-25-30';
const keys = JSON.parse(fs.readFileSync(ROOT + '/_imgconv/keys.json', 'utf8'));
const JSONBIN_BIN = '6a2d8016f5f4af5e29ec2a66';
const JSONBIN_READ = '$2a$10$Htgjeu92rse90o7hAgF4V.G7dneKS6l6ylY8xOF92YOqzRb/COAp2';

(async () => {
  const mapping = JSON.parse(fs.readFileSync(ROOT + '/_imgconv/mapping.json', 'utf8'));
  if (!mapping.length) { console.log('无映射, 退出'); return; }
  if (!keys.masterKey) { console.error('❌ 没有 Master Key, 无法写入'); process.exit(1); }

  const map = new Map(mapping.map(m => [m.from, m.to]));
  console.log('映射条数:', map.size);

  // 拉最新数据
  const gr = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN}/latest`, {
    headers: { 'X-Access-Key': JSONBIN_READ }, signal: AbortSignal.timeout(30000)
  });
  const cloud = (await gr.json()).record;

  // 应用映射
  let replaced = 0;
  const walk = (obj) => {
    if (Array.isArray(obj)) return obj.forEach(walk);
    if (obj && typeof obj === 'object') {
      for (const k of Object.keys(obj)) {
        if (typeof obj[k] === 'string' && map.has(obj[k])) { obj[k] = map.get(obj[k]); replaced++; }
        else walk(obj[k]);
      }
    }
  };
  walk(cloud);
  console.log('替换了', replaced, '处 URL');

  // PUT 回云端
  const pr = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'X-Master-Key': keys.masterKey },
    body: JSON.stringify(cloud),
    signal: AbortSignal.timeout(60000)
  });
  console.log('PUT 状态:', pr.status, pr.ok ? '✅' : '❌ ' + (await pr.text()).slice(0, 200));
  if (!pr.ok) process.exit(1);

  // 验证: 重新拉取确认
  const vr = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN}/latest`, {
    headers: { 'X-Access-Key': JSONBIN_READ }, signal: AbortSignal.timeout(30000)
  });
  const verify = (await vr.json()).record;
  const allUrls = [];
  (verify.members || []).forEach(m => m.avatar && allUrls.push(m.avatar));
  (verify.mentors || []).forEach(m => m.image && allUrls.push(m.image));
  (verify.events || []).forEach(e => e.image && allUrls.push(e.image));
  (verify.carouselImages || []).forEach(c => (c.url || c.src) && allUrls.push(c.url || c.src));
  const oldLeft = allUrls.filter(u => map.has(u)).length;
  const jpgCount = allUrls.filter(u => /\.jpe?g($|\?)/i.test(u)).length;
  console.log('验证: 共', allUrls.length, '个图片URL | jpg:', jpgCount, '| 残留旧URL:', oldLeft);
  console.log(oldLeft === 0 ? '✅ 云端数据更新完成' : '⚠️ 仍有残留, 需检查');
})().catch(e => { console.error('FATAL:', e); process.exit(1); });
