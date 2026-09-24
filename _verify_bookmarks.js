// 验证首页书签导航: 渲染数量 / hover 展开 / 截图
const pw = require('playwright-core');
(async () => {
  const browser = await pw.chromium.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true,
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://127.0.0.1:8899/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);

  const tabs = await page.$$eval('#bmNav .bm-tab', els => els.map(e => ({
    name: e.querySelector('.bm-name').textContent,
    href: e.getAttribute('href'),
    w: Math.round(e.getBoundingClientRect().width),
    h: Math.round(e.getBoundingClientRect().height),
  })));
  console.log('tabs:', JSON.stringify(tabs, null, 1));

  // 截取标题区(含书签)
  const top = await page.$('.home-top');
  if (top) await top.screenshot({ path: 'C:/Users/Administrator/WorkBuddy/2026-06-12-18-25-30/_bm_plain.png' });

  // hover 第二个书签(素素辣鸡排)看展开
  const tabsEls = await page.$$('#bmNav .bm-tab');
  if (tabsEls[1]) {
    await tabsEls[1].hover();
    await page.waitForTimeout(600);
    if (top) await top.screenshot({ path: 'C:/Users/Administrator/WorkBuddy/2026-06-12-18-25-30/_bm_hover.png' });
    const we = await tabsEls[1].evaluate(e => Math.round(e.getBoundingClientRect().width));
    console.log('hover width tab2:', we);
  }

  // 移动端视口
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(800);
  const top2 = await page.$('.home-top');
  if (top2) await top2.screenshot({ path: 'C:/Users/Administrator/WorkBuddy/2026-06-12-18-25-30/_bm_mobile.png' });

  await browser.close();
  console.log('done');
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
