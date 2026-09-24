// 调试: 书签未渲染原因
const pw = require('playwright-core');
(async () => {
  const browser = await pw.chromium.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true,
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = [];
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 200)); });
  page.on('pageerror', e => errs.push('PAGEERR: ' + e.message.slice(0, 300)));
  await page.goto('http://127.0.0.1:8899/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  const info = await page.evaluate(() => {
    const nav = document.getElementById('bmNav');
    return {
      navExists: !!nav,
      navHTML: nav ? nav.innerHTML.slice(0, 200) : null,
      navParent: nav ? nav.parentElement.className : null,
      navVisible: nav ? getComputedStyle(nav).display : null,
      navRect: nav ? JSON.stringify(nav.getBoundingClientRect()) : null,
      appLinks: typeof app !== 'undefined' ? JSON.stringify(app.links || null).slice(0, 300) : 'no app',
      homeTopExists: !!document.querySelector('.home-top'),
    };
  });
  console.log(JSON.stringify(info, null, 1));
  console.log('errors:', errs.slice(0, 8));
  await browser.close();
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
