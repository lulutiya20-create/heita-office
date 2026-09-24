// 处理并上传 Gpose 贴纸：16 张装饰 + 34 张随机头像池
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const https = require('https');

const SRC = 'D:/BaiduNetdiskDownload/FF14 常用资源7.0/FF14 常用资源/FF14 常用资源/07 Gpose贴纸';
const DECOR = ['076755','076759','076761','076766','076705','076706','076707','076709','076711','076723','076724','076725','076728','076729','076730','076749'];
const AVATARS = ['076990','076991','076992','076993','076994','076951','076952','076953','076954','076955','076956','076957','076958','076959','076960','076961','076962','076963','076964','076965','076966','076967','076968','076969','076970','076971','076972','076973','076974','076975','076976','076977','076978','076979'];

const OUT_DECOR = '_stickers2';
const OUT_AVATAR = '_stickers_avatars';
if (!fs.existsSync(OUT_DECOR)) fs.mkdirSync(OUT_DECOR);
if (!fs.existsSync(OUT_AVATAR)) fs.mkdirSync(OUT_AVATAR);

const k = JSON.parse(fs.readFileSync('_imgconv/keys.json', 'utf8'));
const TOKEN = k.ghToken;
const REPO = 'lulutiya20-create/heita-office-images';

function api(method, p, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = https.request({
      hostname: 'api.github.com',
      path: `/repos/${REPO}/contents/${p}`,
      method,
      headers: {
        'Authorization': 'Bearer ' + TOKEN,
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'heita-uploader',
        'Content-Type': 'application/json',
      },
    }, res => {
      let buf = '';
      res.on('data', c => buf += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, json: JSON.parse(buf) }); }
        catch (e) { resolve({ status: res.statusCode, json: {} }); }
      });
    });
    req.on('error', reject);
    req.setTimeout(30000, () => req.destroy(new Error('timeout')));
    if (data) req.write(data);
    req.end();
  });
}

(async () => {
  // 1) 处理装饰贴纸: trim + 最长边 280
  for (const id of DECOR) {
    const out = `${OUT_DECOR}/${id}.png`;
    if (fs.existsSync(out)) { console.log('skip', id); continue; }
    const buf = await sharp(path.join(SRC, `${id}_hr1.png`)).trim({ threshold: 10 }).png().toBuffer();
    await sharp(buf).resize({ width: 280, height: 280, fit: 'inside' })
      .png({ compressionLevel: 9, palette: true, quality: 90 }).toFile(out);
  }
  // 2) 处理头像贴纸: trim + 256x256 方形 contain
  for (const id of AVATARS) {
    const out = `${OUT_AVATAR}/${id}.png`;
    if (fs.existsSync(out)) { console.log('skip', id); continue; }
    const buf = await sharp(path.join(SRC, `${id}_hr1.png`)).trim({ threshold: 10 }).png().toBuffer();
    await sharp(buf).resize(256, 256, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png({ compressionLevel: 9, palette: true, quality: 90 }).toFile(out);
  }
  console.log('processing done');
  // 3) 上传
  let ok = 0, fail = 0;
  const jobs = [];
  for (const id of DECOR) jobs.push([`stickers/${id}.png`, `${OUT_DECOR}/${id}.png`]);
  for (const id of AVATARS) jobs.push([`avatars/stickers/${id}.png`, `${OUT_AVATAR}/${id}.png`]);
  for (const [remote, local] of jobs) {
    const content = fs.readFileSync(local).toString('base64');
    try {
      const r = await api('PUT', remote, { message: `add sticker asset ${path.basename(remote)}`, content, branch: 'main' });
      if (r.status === 200 || r.status === 201) { ok++; console.log('OK  ', remote); }
      else { fail++; console.log('FAIL', remote, r.status, JSON.stringify(r.json).slice(0, 100)); }
    } catch (e) { fail++; console.log('FAIL', remote, e.message); }
  }
  console.log(`\n结果: ${ok} 成功, ${fail} 失败`);
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
