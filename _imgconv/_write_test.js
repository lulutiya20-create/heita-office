// 模拟网页的写入测试: PUT 回相同数据验证 Master Key 可写
const fs = require('fs');
const keys = JSON.parse(fs.readFileSync(__dirname + '/keys.json', 'utf8'));
const MASTER = keys.jsonbinMasterKey || keys.masterKey || keys.master || Object.values(keys)[0];
const BIN = '6a2d8016f5f4af5e29ec2a66';
async function main() {
  const g = await fetch('https://api.jsonbin.io/v3/b/' + BIN + '/latest', {
    headers: { 'X-Master-Key': MASTER, 'X-Bin-Meta': 'false' }
  });
  console.log('读(带MasterKey):', g.status);
  if (g.status !== 200) { console.log('key 无效或网络问题'); return; }
  const record = await g.json();
  const p = await fetch('https://api.jsonbin.io/v3/b/' + BIN, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'X-Master-Key': MASTER },
    body: JSON.stringify(record)
  });
  console.log('写(PUT):', p.status, p.status === 200 ? '✅ Master Key 完全可写' : JSON.stringify(await p.json()).slice(0, 150));
}
main().catch(e => console.error('ERR', e.message));
