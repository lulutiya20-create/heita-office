// 从 creditplayer_hr1.png 第一行(统一小字母组)重新切 26 个字母
// 关键修复: 旧切图按 4x7 均匀网格, 混入了大字母残影导致大小不一
// 新方案: 第一行 26 字母同一行带(y5-145), 实心大写高度统一 45-47px, 基线一致
// 全部按 y=28..112 等高裁切 → 天然统一大小与基线; QR 粘连从覆盖最低谷拆分
const fs = require('fs');
const sharp = require('sharp');

const SRC = 'D:/BaiduNetdiskDownload/FF14 常用资源7.0/FF14 常用资源/FF14 常用资源/16 字体 字母 数字/creditplayer_hr1.png';
const OUT = '_letters2';
const Y0 = 28, Y1 = 112; // 统一竖直裁切窗口(含顶部留白+基线+少量倒影)

(async () => {
  const { data, info } = await sharp(SRC).raw().ensureAlpha().toBuffer({ resolveWithObject: true });
  const { width: W, channels: C } = info;
  const bandTop = 5, bandBot = 145;

  // 1. 列覆盖 → 字形 run
  const colHas = new Array(W).fill(false);
  for (let x = 0; x < W; x++) {
    for (let y = bandTop; y <= bandBot; y++) {
      if (data[(y * W + x) * C + 3] > 10) { colHas[x] = true; break; }
    }
  }
  const runs = []; let s = -1;
  for (let x = 0; x < W; x++) {
    if (colHas[x] && s < 0) s = x;
    if (!colHas[x] && s >= 0) { runs.push([s, x - 1]); s = -1; }
  }
  if (s >= 0) runs.push([s, W - 1]);
  if (runs.length !== 26) throw new Error('expect 26 runs, got ' + runs.length);

  // 2. run16 是 QR 粘连 → 在中部找覆盖最低谷拆分
  const [qx0, qx1] = runs[16];
  const cov = [];
  for (let x = qx0; x <= qx1; x++) {
    let c = 0;
    for (let y = bandTop; y <= bandBot; y++) if (data[(y * W + x) * C + 3] > 10) c++;
    cov.push(c);
  }
  let split = -1, minC = Infinity;
  for (let i = Math.floor(cov.length * 0.3); i < Math.ceil(cov.length * 0.7); i++) {
    if (cov[i] < minC) { minC = cov[i]; split = i; }
  }
  const splitX = qx0 + split;
  console.log('QR split at x=' + splitX + ' (coverage ' + minC + ')');
  const pieces = [];
  for (let i = 0; i < 26; i++) {
    if (i < 16) pieces.push(runs[i]);            // A-P
    else if (i === 16) pieces.push([qx0, splitX - 1]);      // Q
    else if (i === 17) pieces.push([splitX, qx1]);          // R
    else pieces.push(runs[i - 1]);               // S-Z (runs 17-24)
  }
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  // 3. 统一竖直窗口 + 水平重trim(留1px) → 输出
  fs.mkdirSync(OUT, { recursive: true });
  for (let i = 0; i < 26; i++) {
    const L = letters[i];
    let [x0, x1] = pieces[i];
    // 水平重trim
    while (x0 < x1) {
      let has = false;
      for (let y = Y0; y <= Y1; y++) if (data[(y * W + x0) * C + 3] > 10) { has = true; break; }
      if (has) break; x0++;
    }
    while (x1 > x0) {
      let has = false;
      for (let y = Y0; y <= Y1; y++) if (data[(y * W + x1) * C + 3] > 10) { has = true; break; }
      if (has) break; x1--;
    }
    x0 = Math.max(0, x0 - 1); x1 = Math.min(W - 1, x1 + 1);
    const w = x1 - x0 + 1, h = Y1 - Y0 + 1;
    await sharp(SRC).extract({ left: x0, top: Y0, width: w, height: h }).png().toFile(`${OUT}/${L}.png`);
    console.log(L, 'x' + x0 + '-' + x1, 'w=' + w, 'h=' + h);
  }

  // 4. 验证拼图: EVENTS / MEMBERS / GALLERY 深蓝底渲染
  const words = ['EVENTS', 'MEMBERS', 'GALLERY', 'FAMILY TREE'];
  const cell = 60, gap = 6, rowH = 70;
  const comps = [];
  for (let r = 0; r < words.length; r++) {
    const word = words[r];
    let cx = 10;
    for (const ch of word) {
      if (ch === ' ') { cx += 24; continue; }
      const buf = await sharp(`${OUT}/${ch}.png`).resize({ height: 44 }).png().toBuffer();
      const meta = await sharp(buf).metadata();
      comps.push({ input: buf, left: cx, top: r * rowH + 10 });
      cx += meta.width + gap;
    }
  }
  await sharp({ create: { width: 620, height: rowH * words.length, channels: 4, background: { r: 13, g: 20, b: 38, alpha: 255 } } })
    .composite(comps).png().toFile('_letters2_preview.png');
  console.log('preview -> _letters2_preview.png');
})().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
