const pw = require('C:/Users/Administrator/.workbuddy/binaries/node/workspace/node_modules/playwright-core');

(async () => {
  const browser = await pw.chromium.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true,
    args: ['--no-sandbox'],
  });
  const page = await browser.newPage({ viewport: { width: 1080, height: 900 } });
  await page.goto('http://127.0.0.1:8899/', { waitUntil: 'networkidle', timeout: 45000 });
  await page.waitForTimeout(1500);
  // 1) 原始 6 卡布局
  await page.locator('.home-cards').screenshot({ path: 'C:/Users/Administrator/WorkBuddy/2026-06-12-18-25-30/_g_home_plain.png' });
  // 2) 注入 3 条测试外链
  await page.evaluate(() => {
    app.links = [
      { id: 1, name: 'FF14 中文维基', url: 'https://ffxiv.huijiwiki.com/wiki/%E9%A6%96%E9%A1%B5', desc: '国服游戏资料百科' },
      { id: 2, name: '素素攻略', url: 'https://www.ffxiv.cn/', desc: '国服攻略与数据' },
      { id: 3, name: 'Garland Tools', url: 'https://www.garlandtools.org/', desc: '游戏数据查询' },
    ];
    renderHomeLinks();
  });
  await page.waitForTimeout(3000);
  await page.locator('.home-cards').screenshot({ path: 'C:/Users/Administrator/WorkBuddy/2026-06-12-18-25-30/_g_home_links.png' });
  // 3) 卡片加载状态
  const info = await page.evaluate(() => Array.from(document.querySelectorAll('a.home-card.ext')).map(a => ({
    name: a.querySelector('h3').textContent,
    href: a.href,
    img: (i => ({ ok: i.complete && i.naturalWidth > 0, src: i.src.substring(0, 40) }))(a.querySelector('.hc-icon img')),
  })));
  console.log(JSON.stringify(info, null, 1));
  await browser.close();
  console.log('DONE');
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
