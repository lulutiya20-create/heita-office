// 1) 验证 keys.json 里的 Master Key 当前是否真的可写
const fs = require('fs');
const keys = JSON.parse(fs.readFileSync(__dirname + '/keys.json', 'utf8'));
const MASTER = keys.jsonbinMasterKey || keys.masterKey || keys.master || Object.values(keys)[0];
const BIN = '6a2d8016f5f4af5e29ec2a66';
async function main() {
  // 用 metadata 接口验证 key 身份 (PUT 元数据不算写数据)
  const r = await fetch('https://api.jsonbin.io/v3/b/' + BIN + '/meta', {
    headers: { 'X-Master-Key': MASTER }
  });
  console.log('meta status:', r.status);
  const j = await r.json().catch(() => ({}));
  if (r.status === 200) console.log('bin name:', j.record?.name || j.name || '(ok)');
  else console.log('body:', JSON.stringify(j).slice(0, 200));
  // 打印 key 的首尾特征帮助比对
  console.log('key头8位:', MASTER.slice(0, 8), '| 尾4位:', MASTER.slice(-4), '| 长度:', MASTER.length);
}
main().catch(e => console.error('ERR', e.message));
