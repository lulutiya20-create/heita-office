// 查询云端数据中的管理员密码与指定成员密码
const fs = require('fs');
const keys = JSON.parse(fs.readFileSync(__dirname + '/keys.json', 'utf8'));
const MASTER = keys.jsonbinMasterKey || keys.masterKey || keys.master || Object.values(keys)[0];
const BIN = '6a2d8016f5f4af5e29ec2a66';

async function main() {
  const r = await fetch('https://api.jsonbin.io/v3/b/' + BIN + '/latest', {
    headers: { 'X-Master-Key': MASTER, 'X-Bin-Meta': 'false' }
  });
  const j = await r.json();
  const app = j.record && j.record.app ? j.record : j;
  console.log('=== 管理员密码 ===');
  console.log('app.adminPassword =', JSON.stringify(app.adminPassword));
  console.log('app.adminPass =', JSON.stringify(app.adminPass));
  // 扫描 app 顶层所有可能存密码的字段
  for (const k of Object.keys(app)) {
    if (/pass|pwd|secret|token/i.test(k) && k !== 'adminPassword' && k !== 'adminPass') {
      const v = typeof app[k] === 'object' ? JSON.stringify(app[k]) : app[k];
      console.log('app.' + k, '=', String(v).slice(0, 120));
    }
  }
  console.log('\n=== 成员密码 ===');
  const members = app.members || [];
  console.log('成员总数:', members.length);
  // 统计密码分布
  const pwdMap = {};
  for (const m of members) {
    const p = m.password || '(空)';
    pwdMap[p] = (pwdMap[p] || 0) + 1;
  }
  console.log('密码分布:', JSON.stringify(pwdMap));
  // 露露緹雅
  const targets = members.filter(m => /露露|緹雅|lulu/i.test(m.name || ''));
  for (const m of targets) {
    console.log('\n成员:', m.name, '| id:', m.id, '| role:', m.role, '| password:', JSON.stringify(m.password), '| isAdmin:', m.isAdmin);
  }
}
main().catch(e => console.error('ERR', e.message));
