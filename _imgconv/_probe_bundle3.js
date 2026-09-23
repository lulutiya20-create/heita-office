async function main() {
  const bundle = await (await fetch('https://ff14risingstones.web.sdo.com/pc/static/js/index.O3y4emDI.js', { headers: { 'User-Agent': 'Mozilla/5.0' } })).text();
  // Vite lazy chunks: 找 chunk 文件名映射
  const chunks = new Set();
  for (const m of bundle.matchAll(/["']\.?\/?static\/js\/([a-zA-Z0-9._\-]+\.js)["']/g)) chunks.add(m[1]);
  console.log('static chunk names found in index bundle:', [...chunks].length);
  [...chunks].filter(c => /guild|member/i.test(c)).forEach(c => console.log('  MATCH:', c));
  // 也可能用 hash 映射表: "__vite__mapDeps" 或类似
  const idx = bundle.indexOf('guild/main/member');
  if (idx >= 0) console.log('\ncontext around guild/main/member:\n', bundle.slice(Math.max(0, idx - 300), idx + 200));
}
main().catch(e => console.log('err', e.message));
