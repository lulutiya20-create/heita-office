// 复制 Master Key 到用户可读的 txt 文件
const fs = require('fs');
const keys = JSON.parse(fs.readFileSync(__dirname + '/keys.json', 'utf8'));
const MASTER = keys.jsonbinMasterKey || keys.masterKey || keys.master || Object.values(keys)[0];
fs.writeFileSync(__dirname + '/jsonbin-master-key.txt',
  '你的 JSONBin Master Key：\r\n\r\n' + MASTER + '\r\n\r\n' +
  '用途：网页「⚙ JSONBin 配置」里管理员填写，获得云端数据写入权限（多设备管理时需要）。\r\n' +
  '注意：本文件已加入 .gitignore，不会被提交到 GitHub。\r\n');
console.log('written, key length:', MASTER.length);
