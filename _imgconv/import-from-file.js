/**
 * 从桌面 部队信息.txt (石之家接口JSON) 导入成员到族谱
 * 规则：按角色名去重，只增不改；已有同名成员 → 跳过；网站有而数据没有 → 新增
 */
const fs = require('fs');
const path = require('path');

const DIR = __dirname;
const BIN = '6a2d8016f5f4af5e29ec2a66';
const keys = JSON.parse(fs.readFileSync(path.join(DIR, 'keys.json'), 'utf8'));
const MASTER_KEY = keys.masterKey;
const READ_KEY = '$2a$10$Htgjeu92rse90o7hAgF4V.G7dneKS6l6ylY8xOF92YOqzRb/COAp2';
const SRC = 'C:/Users/Administrator/Desktop/部队信息.txt';

async function fetchRetry(url, opts, tries = 4) {
  for (let i = 1; i <= tries; i++) {
    try { return await fetch(url, opts); }
    catch (e) { console.log('  retry', i, e.message); await new Promise(r => setTimeout(r, 2000)); }
  }
  throw new Error('网络请求失败');
}

async function main() {
  // ① 解析网站数据
  const raw = fs.readFileSync(SRC, 'utf8').trim();
  let siteData = null;
  try { siteData = JSON.parse(raw); } catch (e) { /* 可能被截断, 走正则兜底 */ }
  let reg = [], unreg = [];
  if (siteData && siteData.data) {
    reg = siteData.data.registered || [];
    unreg = siteData.data.unRegister || [];
  } else {
    console.log('⚠️ JSON 不完整(可能被截断), 用正则提取角色名...');
    const names = [...raw.matchAll(/"character_name"\s*:\s*"([^"]+)"\s*/g)].map(m => m[1]);
    // 截断风险: 最后一项可能不完整, 校验: 名字后紧跟的原始串里查找是否以完整引号结尾 — 正则已要求闭合引号, 足够安全
    const seen = new Set();
    for (const n of names) { if (!seen.has(n)) { seen.add(n); unreg.push({ character_name: n }); } }
  }
  const all = [...reg, ...unreg].map(m => ({
    name: (m.character_name || '').trim(),
    area: [m.area_name, m.group_name].filter(Boolean).join(' / ')
  })).filter(m => m.name);
  // 名字去重
  const uniq = [];
  const seenName = new Set();
  for (const m of all) { if (!seenName.has(m.name)) { seenName.add(m.name); uniq.push(m); } }
  console.log('① 网站部队共', uniq.length, '人 (注册社区', reg.length, '+ 未注册', unreg.length, ')');

  // ② 云端现有数据
  const r = await fetchRetry('https://api.jsonbin.io/v3/b/' + BIN + '/latest', {
    headers: { 'X-Access-Key': READ_KEY, 'X-Bin-Meta': 'false' }
  });
  const app = (await r.json());
  const data = app.record || app;
  if (!data.members) { console.log('❌ 云端数据结构异常'); process.exit(1); }
  console.log('② 现有成员', data.members.length, '人');

  // ③ 合并
  const existing = new Set(data.members.map(m => (m.name || '').trim()));
  const tpl = data.members[0] || {};
  let baseId = Date.now() * 1000;
  let added = 0, skipped = 0;
  const newNames = [];
  for (const m of uniq) {
    if (existing.has(m.name)) { skipped++; continue; }
    data.members.push({
      id: baseId + added * 7 + Math.floor(Math.random() * 5),
      name: m.name,
      role: tpl.role || '成员',
      info: m.area ? '游戏区服: ' + m.area : '',
      password: 'abc123',
      isAdmin: false,
      avatar: '',
      relations: []
    });
    existing.add(m.name);
    added++;
    newNames.push(m.name);
  }
  console.log('③ 新增', added, '人 / 跳过已存在', skipped, '人');
  if (newNames.length) console.log('   新增名单:', newNames.join('、'));

  if (!added) { console.log('✅ 云端已齐全, 无需更新'); return; }

  // ④ 推送
  const pr = await fetchRetry('https://api.jsonbin.io/v3/b/' + BIN, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'X-Master-Key': MASTER_KEY },
    body: JSON.stringify(data)
  });
  console.log(pr.status === 200 ? '✅ 导入完成! 云端现有 ' + data.members.length + ' 人' : '❌ 推送失败 status=' + pr.status);
}

main().catch(e => { console.log('❌', e.message); process.exit(1); });
