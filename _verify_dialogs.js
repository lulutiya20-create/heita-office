// 验证统一风格对话框: uiPrompt / uiConfirm 渲染与交互
const pw = require('playwright-core');
(async () => {
  const browser = await pw.chromium.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true,
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errs = [];
  page.on('pageerror', e => errs.push(e.message.slice(0, 200)));
  await page.goto('http://127.0.0.1:8899/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // 1) uiPrompt (修改密码场景)
  await page.evaluate(() => { uiPrompt({ title: '修改密码', label: '请输入原密码：', password: true }); });
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'C:/Users/Administrator/WorkBuddy/2026-06-12-18-25-30/_dlg_prompt.png' });

  // 输入 + Enter 提交
  await page.fill('#uiDlgInput', 'test1234');
  await page.keyboard.press('Enter');
  const r1 = await page.evaluate(() => window.__dlgResult);
  // 重新拿 promise 结果: 用一次性 evaluate 挂 promise
  const p1 = page.evaluate(() => uiPrompt({ title: '新建相册', label: '新相册名称:', placeholder: '例如：绝亚猴改革纪念' }));
  await page.waitForTimeout(400);
  await page.fill('#uiDlgInput', '纪念相册');
  await page.screenshot({ path: 'C:/Users/Administrator/WorkBuddy/2026-06-12-18-25-30/_dlg_prompt2.png' });
  await page.click('#uiDlgOk');
  const v = await p1;
  console.log('uiPrompt resolve value:', v);

  // 2) uiConfirm (危险操作)
  const p2 = page.evaluate(() => uiConfirm({ title: '删除相册', message: '删除相册「纪念相册」?\n相册内 3 张图片会移到"未分类",不会被删除。', okText: '删除相册', danger: true }));
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'C:/Users/Administrator/WorkBuddy/2026-06-12-18-25-30/_dlg_confirm.png' });
  await page.click('#uiDlgCancel');
  const v2 = await p2;
  console.log('uiConfirm cancel resolves:', v2);

  // Esc 关闭
  const p3 = page.evaluate(() => uiConfirm({ title: '测试', message: '按 Esc 关闭' }));
  await page.waitForTimeout(300);
  await page.keyboard.press('Escape');
  const v3 = await p3;
  console.log('Esc resolves:', v3);
  const closed = await page.evaluate(() => document.getElementById('uiDlg').style.display);
  console.log('dialog display after close:', closed);

  console.log('pageerrors:', errs.length ? errs : 'none');
  await browser.close();
  console.log('done');
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
