const MASTER_KEY = JSON.parse(require('fs').readFileSync('C:/Users/Administrator/WorkBuddy/2026-06-12-18-25-30/_imgconv/keys.json', 'utf8')).masterKey;
async function main() {
  // 带元数据读取, 看版本和更新时间
  let r = await fetch('https://api.jsonbin.io/v3/b/6a2d8016f5f4af5e29ec2a66/latest', {
    headers: { 'X-Access-Key': '$2a$10$Htgjeu92rse90o7hAgF4V.G7dneKS6l6ylY8xOF92YOqzRb/COAp2' }
  });
  console.log('read status:', r.status);
  const j = await r.json();
  console.log('meta:', JSON.stringify({ updatedAt: j.updatedAt, version: j.version, recordCount: ((j.record || {}).members || []).length }));
}
main().catch(e => console.log('err', e.message));
