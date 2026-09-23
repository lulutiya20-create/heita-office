const FILE = 'mentors/1781414165210765.png';
const HEADERS = { 'User-Agent': 'check' };

async function head(url) {
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch(url, { method: 'GET', headers: { ...HEADERS, Range: 'bytes=0-0' } });
      return { status: r.status, len: r.headers.get('content-range') || r.headers.get('content-length'), cache: r.headers.get('cf-cache-status') || r.headers.get('x-cache') };
    } catch (e) { await new Promise(res => setTimeout(res, 1500)); }
  }
  return { status: 'ERR' };
}

async function main() {
  const cdn = await head('https://cdn.jsdelivr.net/gh/lulutiya20-create/heita-office-images@main/' + FILE);
  const raw = await head('https://raw.githubusercontent.com/lulutiya20-create/heita-office-images/main/' + FILE);
  console.log('jsDelivr CDN:', JSON.stringify(cdn));
  console.log('raw (GitHub) :', JSON.stringify(raw));
}
main();
