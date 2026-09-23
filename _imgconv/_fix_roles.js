/**
 * 把本次导入的 75 名成员身份(role)从默认改为「未来八页」
 */
const fs = require('fs');
const MASTER_KEY = JSON.parse(fs.readFileSync('C:/Users/Administrator/WorkBuddy/2026-06-12-18-25-30/_imgconv/keys.json', 'utf8')).masterKey;
const READ_KEY = '$2a$10$Htgjeu92rse90o7hAgF4V.G7dneKS6l6ylY8xOF92YOqzRb/COAp2';
const NEW_ROLE = '未来八页';

const imported = `伊利雅,青拗,朕的小鱼干呢,闷声fa大财,小气鬼,奈奈何花落,夕木木,竹马子,丸喜三三,书竹,Ayzzz,Asliem,苏蘇,耶梦,伯琅,晚秋大帝,Mikone,暮喵,绯樱玖,Kotoko,青山烟雨客,半醉丶半醒,鹿葵,Ameee,夏洛克贝內特,尤卡卡卡卡,禾木汐,灰狗,小白兔超进化,Kersil,巧克力拌辣椒,梅莉丶,刀疤,我吃芝士蛋糕,熬成粥,梓薯汤圆,依眸,迷糊的柠檬冰,更木更木,擦酱丶,常月纏,绯沐琳,小丧z,打烊,医者不能自医,Atagoo,多多良,大型猫,白马会所头牌,朝思慕颖,柿柿ovo,科琳娅,慕橘,兔梅梅,焉,复数小鱼儿,神木零子,羡飒旁人,稀羽白鸦,即刻輪迴,其名安屿,没猫饼,黒霧方陣,杂修,琼霄玉笙,雨遇鱼,芋咪,周土根儿,齐木里绪,抓恩,汉堡冰可乐,千金金,瞄枪,玖町奈奈子,护士长标本`.split(',');
const nameSet = new Set(imported);

async function fetchRetry(url, opts, tries = 3) {
  for (let i = 1; i <= tries; i++) {
    try { return await fetch(url, opts); }
    catch (e) { await new Promise(r => setTimeout(r, 2000)); }
  }
  throw new Error('网络失败');
}

async function main() {
  let r = await fetchRetry('https://api.jsonbin.io/v3/b/6a2d8016f5f4af5e29ec2a66/latest', {
    headers: { 'X-Access-Key': READ_KEY, 'X-Bin-Meta': 'false' }
  });
  const app = await r.json();
  console.log('当前 members:', app.members.length, '| 导入名单', imported.length, '人');
  if (app.members.length !== 102) console.log('⚠️ 成员数不是 102, 中止以防误改'); 

  let changed = 0, notFound = [];
  const before = {};
  for (const m of app.members) {
    if (nameSet.has((m.name || '').trim())) {
      before[m.name] = m.role;
      m.role = NEW_ROLE;
      changed++;
    }
  }
  for (const n of imported) if (!app.members.some(m => m.name === n)) notFound.push(n);
  console.log('匹配并修改', changed, '人; 未找到', notFound.length, '人', notFound.join(',') || '');
  // 打印修改前的身份分布, 供核对
  const dist = {};
  Object.values(before).forEach(v => dist[v] = (dist[v] || 0) + 1);
  console.log('修改前身份分布:', JSON.stringify(dist));

  r = await fetchRetry('https://api.jsonbin.io/v3/b/6a2d8016f5f4af5e29ec2a66', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'X-Master-Key': MASTER_KEY },
    body: JSON.stringify(app)
  });
  console.log('PUT status:', r.status);

  // 读回终验
  r = await fetchRetry('https://api.jsonbin.io/v3/b/6a2d8016f5f4af5e29ec2a66/latest', {
    headers: { 'X-Access-Key': READ_KEY, 'X-Bin-Meta': 'false' }
  });
  const fin = await r.json();
  const cnt = fin.members.filter(m => m.role === NEW_ROLE).length;
  console.log('终验: members=', fin.members.length, '| 身份为「' + NEW_ROLE + '」的成员:', cnt, '人');
}
main().catch(e => { console.log('❌', e.message); process.exit(1); });
