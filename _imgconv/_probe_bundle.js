// 在 JS bundle 里搜 guild/member 相关 API 路径
async function get(url) {
  const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 Chrome/126' } });
  return r.text();
}
async function main() {
  const base = 'https://ff14risingstones.web.sdo.com/pc/';
  const bundle = await get(base + 'static/js/index.O3y4emDI.js');
  console.log('bundle len:', bundle.length);
  // 搜 api 路径
  const apis = new Set();
  for (const m of bundle.matchAll(/["'](\/[a-zA-Z0-9_\-\/]*(?:guild|member|user)[a-zA-Z0-9_\-\/]*)["']/gi)) apis.add(m[1]);
  console.log('API-ish paths:');
  [...apis].slice(0, 60).forEach(a => console.log(' ', a));
  // 搜域名
  const domains = new Set();
  for (const m of bundle.matchAll(/https?:\/\/[a-z0-9.\-]+sdo\.com[a-zA-Z0-9\/\-_]*/gi)) domains.add(m[0]);
  console.log('sdo domains:', [...domains].slice(0, 20));
}
main().catch(e => console.log('err', e.message));
