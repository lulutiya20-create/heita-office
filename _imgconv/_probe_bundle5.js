async function main() {
  const base = 'https://ff14risingstones.web.sdo.com/pc/static/js/';
  const g = await (await fetch(base + 'guild.BmapY44R.js', { headers: { 'User-Agent': 'Mozilla/5.0' } })).text();
  console.log('guild.js len:', g.length);
  // API 定义一般是 const xxx = url=>get("/path") 之类，把所有字符串路径列出来
  const paths = new Set();
  for (const m of g.matchAll(/["']([a-zA-Z][a-zA-Z0-9_\/\-]{3,70})["']/g)) {
    const v = m[1];
    if (v.includes('/') && !/^(https?|static|pc|mob)\b/.test(v)) paths.add(v);
  }
  console.log('paths:');
  [...paths].slice(0, 60).forEach(p => console.log(' ', p));
}
main().catch(e => console.log('err', e.message));
