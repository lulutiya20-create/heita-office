// 上传标题字母 + Gpose 贴纸到 heita-office-images 图床
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

async function upload(localPath, repoPath, msg) {
  // 已存在则取 sha 覆盖
  let sha;
  const g = await api('GET', repoPath);
  if (g.status === 200) sha = g.json.sha;
  const content = fs.readFileSync(localPath).toString('base64');
  const r = await api('PUT', repoPath, { message: msg, content, branch: BRANCH, sha });
  if (r.status === 200 || r.status === 201) {
    console.log('OK  ', repoPath);
    return true;
  }
  console.log('FAIL', repoPath, r.status, JSON.stringify(r.json).slice(0, 120));
  return false;
}

(async () => {
  let ok = 0, fail = 0;
  // 26 个字母 -> fonts/letters/
  for (const L of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')) {
    const f = `_letters/${L}.png`;
    if (!fs.existsSync(f)) { console.log('skip', L); fail++; continue; }
    (await upload(f, `fonts/letters/${L}.png`, `add letter ${L}`)) ? ok++ : fail++;
  }
  // 10 张贴纸 -> stickers/
  for (const f of fs.readdirSync('_stickers')) {
    (await upload(`_stickers/${f}`, `stickers/${f}`, 'add gpose sticker ' + f)) ? ok++ : fail++;
  }
  console.log(`\n结果: ${ok} 成功, ${fail} 失败`);
})();
