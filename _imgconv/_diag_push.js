const fs = require('fs');
const MASTER_KEY = JSON.parse(fs.readFileSync('C:/Users/Administrator/WorkBuddy/2026-06-12-18-25-30/_imgconv/keys.json', 'utf8')).masterKey;
const READ_KEY = '$2a$10$Htgjeu92rse90o7hAgF4V.G7dneKS6l6ylY8xOF92YOqzRb/COAp2';

async function fetchRetry(url, opts, tries = 3) {
  for (let i = 1; i <= tries; i++) {
    try { return await fetch(url, opts); }
    catch (e) { await new Promise(r => setTimeout(r, 2000)); }
  }
  throw new Error('网络失败');
}

async function main() {
  // 1. 读当前
  let r = await fetchRetry('https://api.jsonbin.io/v3/b/6a2d8016f5f4af5e29ec2a66/latest', {
    headers: { 'X-Access-Key': READ_KEY, 'X-Bin-Meta': 'false' }
  });
  const data = await r.json();
  const app = data.record || data;
  console.log('当前 members:', app.members.length);

  // 2. 原样 PUT 回去, 打印完整响应
  r = await fetchRetry('https://api.jsonbin.io/v3/b/6a2d8016f5f4af5e29ec2a66', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'X-Master-Key': MASTER_KEY },
    body: JSON.stringify(app)
  });
  const body = await r.text();
  console.log('PUT status:', r.status);
  console.log('PUT response:', body.slice(0, 500));

  // 3. 立即读回验证
  r = await fetchRetry('https://api.jsonbin.io/v3/b/6a2d8016f5f4af5e29ec2a66/latest', {
    headers: { 'X-Access-Key': READ_KEY, 'X-Bin-Meta': 'false' }
  });
  const back = await r.json();
  const app2 = back.record || back;
  console.log('PUT后读回 members:', app2.members.length);
}
main().catch(e => console.log('err', e.message));
