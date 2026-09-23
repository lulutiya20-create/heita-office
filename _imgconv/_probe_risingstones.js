// 探索石之家站点的结构与接口
async function get(url, opts = {}) {
  const r = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36', Referer: 'https://ff14risingstones.web.sdo.com/pc/index.html', ...opts.headers }
  });
  return { status: r.status, text: await r.text(), ct: r.headers.get('content-type') };
}

async function main() {
  // 1) 主页 HTML - 找 JS bundle
  const home = await get('https://ff14risingstones.web.sdo.com/pc/index.html');
  console.log('home:', home.status, home.ct, 'len:', home.text.length);
  const scripts = [...home.text.matchAll(/src="([^"]+\.js[^"]*)"/g)].map(m => m[1]);
  console.log('scripts:', scripts.slice(0, 10));
}
main().catch(e => console.log('err', e.message));
