// 上传重切的统一字母到 fonts/letters2/ (新路径, 避开 jsDelivr 旧缓存)
const fs = require('fs');
const https = require('https');

const k = JSON.parse(fs.readFileSync('_imgconv/keys.json', 'utf8'));
const TOKEN = k.ghToken;
const REPO = 'lulutiya20-create/heita-office-images';
const BRANCH = 'main';

function api(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = https.request({
      hostname: 'api.github.com',
      path: `/repos/${REPO}/contents/${path}`,
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
    req.setTimeout(30000, () => { req.destroy(new Error('timeout')); });
    if (data) req.write(data);
    req.end();
  });
}

(async () => {
  let ok = 0, fail = 0;
  for (const L of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')) {
    const f = `_letters2/${L}.png`;
    if (!fs.existsSync(f)) { console.log('skip', L); fail++; continue; }
    const content = fs.readFileSync(f).toString('base64');
    const r = await api('PUT', `fonts/letters2/${L}.png`, { message: `add uniform letter ${L}`, content, branch: BRANCH });
    if (r.status === 200 || r.status === 201) { console.log('OK  ', L); ok++; }
    else { console.log('FAIL', L, r.status, JSON.stringify(r.json).slice(0, 120)); fail++; }
  }
  console.log(`\n结果: ${ok} 成功, ${fail} 失败`);
})();
