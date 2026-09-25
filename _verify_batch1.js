// 验证第一批优化: hash 路由 / 启动无报错 / 各页正常渲染 / beacon 不阻塞
const pw = require('playwright-core');
(async () => {
  const browser = await pw.chromium.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true,
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message.slice(0, 150)));
  page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 150)); });

  // 1) 首页加载
  await page.goto('http://127.0.0.1:8899/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  const homeActive = await page.evaluate(() => document.getElementById('page-home').classList.contains('active'));
  const hash1 = await page.evaluate(() => location.hash);
  console.log('首页 active:', homeActive, '| hash:', hash1);

  // 2) 点击导航到族谱 → hash 应变
  await page.evaluate(() => navigate('/familytree'));
  await page.waitForTimeout(600);
  console.log('族谱 hash:', await page.evaluate(() => location.hash));
  const ftNodes = await page.evaluate(() => document.querySelectorAll('#ftSvg .ft-node').length);
  console.log('族谱节点数:', ftNodes);

  // 3) 图库 / 成员 / 留言 页切换
  await page.evaluate(() => navigate('/gallery'));
  await page.waitForTimeout(600);
  console.log('图库 hash:', await page.evaluate(() => location.hash),
    '| items:', await page.evaluate(() => document.querySelectorAll('.gl-item').length));
  await page.evaluate(() => navigate('/members'));
  await page.waitForTimeout(600);
  console.log('成员 hash:', await page.evaluate(() => location.hash),
    '| cards:', await page.evaluate(() => document.querySelectorAll('#memberGrid .member-card, .members-grid .member-card').length));

  // 4) 直接打开 hash 链接 → 应回复到该页
  await page.goto('http://127.0.0.1:8899/#/messages', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  console.log('直开 #/messages → active page:',
    await page.evaluate(() => document.querySelector('.page.active') && document.querySelector('.page.active').id),
    '| hash:', await page.evaluate(() => location.hash));

  // 5) 非法 hash 兜底回首页
  await page.goto('http://127.0.0.1:8899/#/notexist', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  console.log('非法 hash → active page:',
    await page.evaluate(() => document.querySelector('.page.active') && document.querySelector('.page.active').id));

  // 6) beacon 上报是否触发 (load 后应有 __reportBeaconView 执行痕迹: 无异常即通过)
  const beaconState = await page.evaluate(() => typeof __reportBeaconView);
  console.log('__reportBeaconView 类型:', beaconState);

  // 7) saveLocal 容错: 模拟配额溢出不抛异常
  const saveOk = await page.evaluate(() => {
    try {
      const orig = localStorage.setItem.bind(localStorage);
      localStorage.setItem = () => { const e = new Error('QuotaExceededError'); e.name = 'QuotaExceededError'; throw e; };
      saveLocal({ members: [{ id: 1 }] });
      localStorage.setItem = orig;
      return 'no-throw';
    } catch (e) { return 'THREW: ' + e.message; }
  });
  console.log('saveLocal 配额保护:', saveOk);

  console.log('JS 错误数:', errs.length);
  errs.slice(0, 6).forEach(e => console.log('  -', e));
  await page.screenshot({ path: 'C:/Users/Administrator/WorkBuddy/2026-06-12-18-25-30/_batch1_verify.png' });
  await browser.close();
  console.log('VERIFY DONE');
})().catch(e => { console.error('VERIFY FAIL:', e.message); process.exit(1); });
