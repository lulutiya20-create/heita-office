const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const base = 'D:/BaiduNetdiskDownload/FF14 常用资源7.0/FF14 常用资源-铭牌 肖像';
(async () => {
  const p = path.join(base, '191000 肖像装饰框', '191511_hr1.png');
  const { data, info } = await sharp(p).raw().ensureAlpha().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height, C = info.channels;
  const solid = (x, y) => data[(y * W + x) * C + 3] > 60;
  let lt = 0; for (let x = 0; x < W; x++) { if (solid(x, Math.floor(H / 2))) { lt = x; break; } }
  let tt = 0; for (let y = 0; y < H; y++) { if (solid(Math.floor(W / 2), y)) { tt = y; break; } }
  console.log('size', W + 'x' + H, 'left-bar', lt, 'top-bar', tt);
  let x0 = W, x1 = 0, y0 = H, y1 = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (data[(y * W + x) * C + 3] > 10) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  }
  console.log('bbox', x0, y0, x1, y1);
  // 处理三张图: 191426 导师框 384x630, 191511 边框 384x630, 192427 徽章 高256
  const outDir = '_frames';
  fs.mkdirSync(outDir, { recursive: true });
  await sharp(path.join(base, '191000 肖像装饰框', '191426_hr1.png')).resize(384, 630, { fit: 'fill' }).png({ compressionLevel: 9, palette: true, quality: 90 }).toFile(outDir + '/191426.png');
  await sharp(p).resize(384, 630, { fit: 'fill' }).png({ compressionLevel: 9, palette: true, quality: 90 }).toFile(outDir + '/191511.png');
  await sharp(path.join(base, '192000 肖像装饰物', '192427_hr1.png')).resize({ height: 256 }).png({ compressionLevel: 9, palette: true, quality: 90 }).toFile(outDir + '/192427.png');
  for (const f of ['191426', '191511', '192427']) {
    const st = fs.statSync(outDir + '/' + f + '.png');
    console.log(f + '.png', Math.round(st.size / 1024) + 'KB');
  }
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
