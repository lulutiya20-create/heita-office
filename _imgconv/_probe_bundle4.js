async function main() {
  const base = 'https://ff14risingstones.web.sdo.com/pc/static/js/';
  const chunk = await (await fetch(base + 'GuildMember.BKi4s4NN.js', { headers: { 'User-Agent': 'Mozilla/5.0' } })).text();
  console.log('chunk len:', chunk.length);
  // 找 API 函数名与路径
  const urls = new Set();
  for (const m of chunk.matchAll(/["']([a-zA-Z0-9_\/\-]*\/[a-zA-Z0-9_\/\-]+)["']/g)) {
    const v = m[1];
    if (/guild|member|Guild|Member/i.test(v) && !v.startsWith('/guild/main') && v.length < 70) urls.add(v);
  }
  console.log('candidate API paths:');
  [...urls].slice(0, 40).forEach(u => console.log(' ', u));
  // import 的 api 模块
  const imps = [...chunk.matchAll(/import\{([^}]+)\}from"\.\/([^"]+\.js)"/g)].map(m => m[2]);
  console.log('imports:', [...new Set(imps)].slice(0, 15));
}
main().catch(e => console.log('err', e.message));
