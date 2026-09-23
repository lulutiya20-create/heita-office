async function purge(url) {
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch(url, { method: 'GET', headers: { 'User-Agent': 'check' } });
      const j = await r.json().catch(() => ({}));
      return { status: r.status, j };
    } catch (e) { await new Promise(res => setTimeout(res, 1500)); }
  }
  return { status: 'ERR' };
}

async function size(url) {
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch(url, { method: 'GET', headers: { 'User-Agent': 'check', Range: 'bytes=0-0' } });
      const cr = r.headers.get('content-range') || '';
      return cr.split('/')[1] || '?';
    } catch (e) { await new Promise(res => setTimeout(res, 1500)); }
  }
  return 'ERR';
}

async function main() {
  const base = 'gh/lulutiya20-create/heita-office-images@main/';
  const files = ['mentors/1781414165210765.png'];
  for (const f of files) {
    console.log('purging', f, '...');
    const res = await purge('https://purge.jsdelivr.net/' + base + f);
    console.log('  purge status:', res.status, JSON.stringify(res.j).slice(0, 200));
  }
  await new Promise(r => setTimeout(r, 3000));
  console.log('CDN size after purge:', await size('https://cdn.jsdelivr.net/' + base + files[0]), '(expect ~7501618)');
}
main();
