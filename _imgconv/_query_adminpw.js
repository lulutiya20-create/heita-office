// 查询云端管理员密码 (用户本人请求)
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
  console.log('app.adminPassword =', JSON.stringify(app.adminPassword));
}
main().catch(e => console.error('ERR', e.message));
