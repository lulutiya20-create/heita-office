async function main() {
  const bundle = await (await fetch('https://ff14risingstones.web.sdo.com/pc/static/js/index.O3y4emDI.js', { headers: { 'User-Agent': 'Mozilla/5.0' } })).text();
  // 搜 gcId / gc_id 附近的 API 调用
  const hits = new Set();
  for (const m of bundle.matchAll(/["']((?:\/api)?\/?[a-zA-Z0-9_\/]*(?:Guild|guild|Member|member)[a-zA-Z0-9_\/]*)["']/g)) {
    if (m[1].length < 60 && (m[1].includes('/') || m[1].length > 8)) hits.add(m[1]);
  }
  console.log('candidate api strings:');
  [...hits].forEach(h => console.log(' ', h));
  // 找 "api/home/" 后拼接的路径
  const concats = new Set();
  for (const m of bundle.matchAll(/api\/home\/([a-zA-Z0-9_\/\.]+)/g)) concats.add(m[1]);
  console.log('api/home paths in urls:', [...concats].slice(0, 30));
  // 找 post/get 调用的 url 常量: 常见 axios 封装 url: "xxx/xxx"
  const urls = new Set();
  for (const m of bundle.matchAll(/url:\s*["'`]([^"'`]+)["'`]/g)) urls.add(m[1]);
  console.log('url: constants:');
  [...urls].slice(0, 80).forEach(u => console.log(' ', u));
}
main().catch(e => console.log('err', e.message));
