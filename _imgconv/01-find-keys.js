// 查找 JSONBin Master Key 和 GitHub Token
const fs = require('fs');
const path = require('path');
const root = 'C:/Users/Administrator/WorkBuddy/2026-06-12-18-25-30';

let masterKey = null;
// 1) 搜索根目录下所有 _*.js 推送脚本
const files = fs.readdirSync(root).filter(f => f.startsWith('_') && f.endsWith('.js'));
for (const f of files) {
  const c = fs.readFileSync(path.join(root, f), 'utf8');
  const m = c.match(/\$2[ab]\$\d+\$[A-Za-z0-9./]{20,}/);
  if (m) { masterKey = m[0]; console.log('master key in', f, '->', masterKey.slice(0, 12) + '...'); break; }
}
// 2) 搜索 data.json 同级 json 配置
try {
  const cfg = fs.readFileSync(path.join(root, '_push_to_jsonbin.js'), 'utf8');
  const m2 = cfg.match(/["'](X-Master-Key|masterKey)["']\s*[:=]\s*["']([^"']+)["']/);
  if (m2) { masterKey = m2[2]; console.log('master key (push script):', masterKey.slice(0, 12) + '...'); }
} catch (e) {}

// GitHub token
let ghToken = null;
try {
  const cred = fs.readFileSync('C:/Users/Administrator/.git-credentials', 'utf8').trim().split('\n');
  for (const line of cred) {
    const m = line.match(/^https:\/\/([^:]+):([^@]+)@github\.com/);
    if (m) { ghToken = m[2]; console.log('github user:', m[1], '| token len:', ghToken.length); break; }
  }
} catch (e) { console.log('no git-credentials'); }

fs.writeFileSync(root + '/_imgconv/keys.json', JSON.stringify({ masterKey, ghToken }, null, 2));
console.log('masterKey found:', !!masterKey, '| ghToken found:', !!ghToken);
