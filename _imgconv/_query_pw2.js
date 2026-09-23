// 查询云端成员密码 (用户本人请求排查自己的账号)
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
  const members = app.members || [];
  console.log('成员总数:', members.length);
  const t = members.filter(m => /露露|緹雅/i.test(m.name || ''));
  for (const m of t) {
    console.log('name:', m.name, '| id:', m.id, '| role:', m.role, '| password:', JSON.stringify(m.password), '| len:', (m.password||'').length, '| isAdmin:', m.isAdmin);
  }
  // 密码分布统计（不打印完整密码，只统计）
  const dist = {};
  members.forEach(m => { const p = m.password || '(空)'; const k = p.length + '位'; dist[k] = (dist[k] || 0) + 1; });
  console.log('密码长度分布:', JSON.stringify(dist));
}
main().catch(e => console.error('ERR', e.message));
