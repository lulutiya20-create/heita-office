async function main() {
  const bundle = await (await fetch('https://ff14risingstones.web.sdo.com/pc/static/js/index.O3y4emDI.js', { headers: { 'User-Agent': 'Mozilla/5.0' } })).text();
  for (const kw of ['withCredentials', 'baseURL', 'interceptors.request', 'X-Requested', 'sign', 'timestamp']) {
    let i = -1, found = 0;
    while ((i = bundle.indexOf(kw, i + 1)) !== -1 && found < 2) {
      found++;
      console.log('--- ' + kw + ' @' + i + ' ---');
      console.log(bundle.slice(Math.max(0, i - 150), i + 200).replace(/\n/g, ' ').slice(0, 350));
      console.log();
    }
    if (!found) console.log('--- ' + kw + ': not found ---');
  }
}
main().catch(e => console.log('err', e.message));
