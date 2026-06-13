// 一次性脚本: 把 4MB 备份推送到 JSONBin
// 用法: node _push_to_jsonbin.js

const fs = require('fs');
const path = require('path');

const MASTER_KEY = '$2a$10$tglai8xzGNfmL54lxCvTN.Uq6EkKAypHwzDVrhRR2FD23DpQKT0a6';
const READ_KEY   = '$2a$10$Htgjeu92rse90o7hAgF4V.G7dneKS6l6ylY8xOF92YOqzRb/COAp2';
const BIN_ID     = '6a2d8016f5f4af5e29ec2a66';
const BACKUP     = 'C:\\Users\\Administrator\\WorkBuddy\\2026-06-12-18-25-30\\_jsonbin_payload.json';

(async () => {
  console.log('==== JSONBin 数据推送 ====');
  console.log('Bin ID:', BIN_ID);
  console.log('备份文件:', BACKUP);

  // 1) 读备份
  let data;
  try {
    const raw = fs.readFileSync(BACKUP, 'utf8');
    data = JSON.parse(raw);
    console.log('✅ 备份读取成功, 大小:', (raw.length / 1024 / 1024).toFixed(2), 'MB');
  } catch (e) {
    console.error('❌ 读备份失败:', e.message);
    process.exit(1);
  }

  // 2) 校验
  if (!data.members || !Array.isArray(data.members)) {
    console.error('❌ 备份格式错误: 缺少 members 数组');
    process.exit(1);
  }
  console.log('✅ 成员数:', data.members.length);
  console.log('   - 第一个成员:', data.members[0].name);
  console.log('   - 最后一个成员:', data.members[data.members.length - 1].name);

  // 3) PUT 到 JSONBin (完整覆盖)
  console.log('\n---- 开始 PUT 到 JSONBin ----');
  const url = `https://api.jsonbin.io/v3/b/${BIN_ID}`;
  const body = JSON.stringify(data);

  const resp = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Master-Key': MASTER_KEY
    },
    body
  });

  console.log('HTTP 状态:', resp.status);
  const result = await resp.json();

  if (!resp.ok) {
    console.error('❌ 推送失败:', JSON.stringify(result, null, 2));
    process.exit(1);
  }

  console.log('✅ 推送成功!');
  console.log('   - 记录大小:', (JSON.stringify(result.record).length / 1024 / 1024).toFixed(2), 'MB');
  console.log('   - 元数据:', JSON.stringify(result.metadata, null, 2));

  // 4) 用 Read Key 验证 GET
  console.log('\n---- 用 Access Key 验证 GET ----');
  const readResp = await fetch(`${url}/latest`, {
    headers: { 'X-Access-Key': READ_KEY }
  });
  console.log('GET 状态:', readResp.status);

  if (readResp.ok) {
    const readData = await readResp.json();
    console.log('✅ 读回成功, 成员数:', (readData.record && readData.record.members || []).length);
  } else {
    const err = await readResp.json();
    console.error('❌ GET 失败:', JSON.stringify(err));
  }

  console.log('\n==== 完成 ====');
})();
