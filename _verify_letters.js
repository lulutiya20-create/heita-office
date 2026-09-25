// 用 playwright-core 直连本机 Chrome 验证各页标题字母
const path = require('path');
const pw = require('C:/Users/Administrator/.workbuddy/binaries/node/workspace/node_modules/playwright-core');

(async () => {
  const browser = await pw.chromium.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true,
    args: ['--no-sandbox'],
  });
  const page = await browser.newPage({ viewport: { width: 1080, height: 534 } });
  await page.goto('http://127.0.0.1:8899/', { waitUntil: 'networkidle', timeout: 45000 });

  const routes = [
    ['/home', "button[data-path='/']", '_v_home'],
    ['/members', "button[data-path='/members']", '_v_members'],
    ['/events', "button[data-path='/events']", '_v_events'],
    ['/gallery', "button[data-path='/gallery']", '_v_gallery'],
    ['/mentors', "button[data-path='/mentors']", '_v_mentors'],
    ['/messages', "button[data-path='/messages']", '_v_messages'],
    ['/familytree', "button[data-path='/familytree']", '_v_familytree'],
  ];
  for (const [r, sel, name] of routes) {
    await page.click(sel);
    await page.waitForTimeout(1200);
    const info = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.ph-en img')).map(i => ({
        alt: i.alt,
        ok: i.complete && i.naturalWidth > 0,
        w: Math.round(i.getBoundingClientRect().width),
        h: Math.round(i.getBoundingClientRect().height),
        src: i.src.split('/').slice(-2).join('/'),
      }));
    });
    console.log('== ' + r + ' ==', JSON.stringify(info));
    const el = await page.locator('.page-header:visible').first().elementHandle().catch(() => null);
    if (el) await el.screenshot({ path: 'C:/Users/Administrator/WorkBuddy/2026-06-12-18-25-30/' + name + '.png' });
    else console.log('no visible header for ' + r);
  }
  await browser.close();
  console.log('DONE');
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
