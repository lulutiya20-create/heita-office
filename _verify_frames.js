const pw = require('C:/Users/Administrator/.workbuddy/binaries/node/workspace/node_modules/playwright-core');

(async () => {
  const browser = await pw.chromium.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true,
    args: ['--no-sandbox'],
  });
  const page = await browser.newPage({ viewport: { width: 1080, height: 800 } });
  await page.goto('http://127.0.0.1:8899/', { waitUntil: 'networkidle', timeout: 45000 });

  const shots = [
    ['/members', "button[data-path='/members']", '_f_members'],
    ['/messages', "button[data-path='/messages']", '_f_messages'],
    ['/events', "button[data-path='/events']", '_f_events'],
    ['/home', "button[data-path='/']", '_f_home'],
  ];
  for (const [r, sel, name] of shots) {
    await page.click(sel);
    await page.waitForTimeout(2500);
    await page.screenshot({ path: 'C:/Users/Administrator/WorkBuddy/2026-06-12-18-25-30/' + name + '.png' });
    console.log('shot', name);
  }
  await browser.close();
  console.log('DONE');
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
