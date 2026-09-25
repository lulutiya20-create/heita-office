// 单独验证: 全新加载非法 hash 应回首页; 合法 hash 直达
const pw = require('playwright-core');
(async () => {
  const browser = await pw.chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto('http://127.0.0.1:8899/?fresh=1#/notexist', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2200);
  console.log('非法 hash 全新加载 → active:',
    await page.evaluate(() => document.querySelector('.page.active') && document.querySelector('.page.active').id),
    '| hash:', await page.evaluate(() => location.hash));
  await page.goto('http://127.0.0.1:8899/?fresh=2#/mentors', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2200);
  console.log('#/mentors 全新加载 → active:',
    await page.evaluate(() => document.querySelector('.page.active') && document.querySelector('.page.active').id));
  // 前进后退: 点击导航后 history.back 应回到上一页
  await page.evaluate(() => navigate('/events'));
  await page.waitForTimeout(400);
  await page.evaluate(() => navigate('/messages'));
  await page.waitForTimeout(400);
  await page.goBack();
  await page.waitForTimeout(600);
  console.log('后退 → active:',
    await page.evaluate(() => document.querySelector('.page.active') && document.querySelector('.page.active').id),
    '| hash:', await page.evaluate(() => location.hash));
  await browser.close();
  console.log('DONE');
})().catch(e => { console.error('FAIL:', e.message); process.exit(1); });
