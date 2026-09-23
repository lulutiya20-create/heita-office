/**
 * 石之家部队成员导入脚本（只增不改，不影响现有数据）
 *
 * 使用方法：
 * 1. 浏览器登录石之家 (https://ff14risingstones.web.sdo.com/pc/index.html)
 * 2. F12 打开开发者工具 → Network(网络) → 刷新部队成员页面
 * 3. 找到 getGuildMember 请求 → Request Headers(请求标头) → 复制整段 Cookie: 后面的值
 * 4. 粘贴到本目录 sdo-cookie.txt（只需一行 cookie）
 * 5. 运行: node _imgconv/import-risingstones.js
 *
 * 合并规则：按角色名去重，已存在同名成员 → 跳过；新成员 → 追加（默认角色"成员"、密码 abc123、无关系）
 */
const fs = require('fs');
const path = require('path');

const DIR = __dirname;
const GC_ID = '9392397760369529265'; // 黑塔办事处部队 ID
const BIN = '6a2d8016f5f4af5e29ec2a66';
const keys = JSON.parse(fs.readFileSync(path.join(DIR, 'keys.json'), 'utf8'));
const MASTER_KEY = keys.masterKey;
const READ_KEY = '$2a$10$Htgjeu92rse90o7hAgF4V.G7dneKS6l6ylY8xOF92YOqzRb/COAp2';

function readCookie() {
  const p = path.join(DIR, 'sdo-cookie.txt');
  if (!fs.existsSync(p)) { console.log('❌ 未找到 sdo-cookie.txt，请按脚本头部说明复制 Cookie'); process.exit(1); }
  let c = fs.readFileSync(p, 'utf8').trim();
  c = c.replace(/^Cookie:\s*/i, '');
  if (!c) { console.log('❌ sdo-cookie.txt 是空的'); process.exit(1); }
  return c;
}

async function fetchRetry(url, opts, tries = 4) {
  for (let i = 1; i <= tries; i++) {
    try { return await fetch(url, opts); }
    catch (e) { console.log('  retry', i, e.message); await new Promise(r => setTimeout(r, 2000)); }
  }
  throw new Error('网络请求失败');
}

function tempsuid() {
  // 模仿前端: 随机 uid 参数（反爬跟踪用）
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

async function fetchGuildMembers(cookie) {
  const url = 'https://apiff14risingstones.web.sdo.com/api/home/guild/getGuildMember?guild_id=' + GC_ID + '&tempsuid=' + tempsuid();
  const r = await fetchRetry(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
      Accept: 'application/json, text/plain, */*',
      Referer: 'https://ff14risingstones.web.sdo.com/pc/index.html',
      Origin: 'https://ff14risingstones.web.sdo.com',
      Cookie: cookie
    }
  });
  const j = await r.json();
  if (j.code !== 10000 && j.code !== 10002) {
    throw new Error('接口返回 code=' + j.code + ' msg=' + (j.msg || j.message) + (j.code === 10403 ? '（Cookie 失效，请重新复制）' : ''));
  }
  return { registered: (j.data && j.data.registered) || [], unRegister: (j.data && j.data.unRegister) || [] };
}

async function loadCloudData() {
  const r = await fetchRetry('https://api.jsonbin.io/v3/b/' + BIN + '/latest', {
    headers: { 'X-Access-Key': READ_KEY, 'X-Bin-Meta': 'false' }
  });
  const j = await r.json();
  return j;
}

async function pushCloudData(data) {
  const r = await fetchRetry('https://api.jsonbin.io/v3/b/' + BIN, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'X-Master-Key': MASTER_KEY },
    body: JSON.stringify(data)
  });
  return r.status;
}

async function main() {
  const cookie = readCookie();
  console.log('① 拉取石之家部队成员...');
  const { registered, unRegister } = await fetchGuildMembers(cookie);
  const all = [...registered, ...unRegister];
  console.log('   部队共', all.length, '人 (已注册社区', registered.length, '+ 未注册', unRegister.length, ')');

  console.log('② 读取云端现有数据...');
  const cloud = await loadCloudData();
  const app = cloud && (cloud.record || cloud);
  if (!app || !app.members) { console.log('❌ 云端数据结构异常'); process.exit(1); }
  const existingNames = new Set(app.members.map(m => (m.name || '').trim()));
  const template = app.members[0] || {};
  console.log('   现有成员', app.members.length, '人');

  console.log('③ 合并新成员（只增不改）...');
  let baseId = Date.now() * 1000;
  let added = 0, skipped = 0;
  const newNames = [];
  for (const rm of all) {
    const name = (rm.character_name || '').trim();
    if (!name) continue;
    if (existingNames.has(name)) { skipped++; continue; }
    const m = {
      id: baseId + added * 7 + Math.floor(Math.random() * 5),
      name,
      role: template.role || '成员',
      info: '',
      password: 'abc123',
      isAdmin: false,
      avatar: '',
      relations: []
    };
    // 保留石之家的服务器信息到 info
    const area = [rm.area_name, rm.group_name].filter(Boolean).join(' / ');
    if (area) m.info = '游戏区服: ' + area;
    app.members.push(m);
    existingNames.add(name);
    added++;
    newNames.push(name);
  }
  console.log('   新增', added, '人, 跳过(已存在)', skipped, '人');
  if (newNames.length) console.log('   新成员:', newNames.join(', '));

  if (added === 0) { console.log('✅ 无需更新'); return; }
  console.log('④ 推送云端...');
  const st = await pushCloudData(app);
  console.log(st === 200 ? '✅ 导入完成! 云端已更新 (' + app.members.length + ' 人)' : '❌ 推送失败 status=' + st);
}

main().catch(e => { console.log('❌', e.message); process.exit(1); });
