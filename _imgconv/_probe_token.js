async function main() {
  const bundle = await (await fetch('https://ff14risingstones.web.sdo.com/pc/static/js/index.O3y4emDI.js', { headers: { 'User-Agent': 'Mozilla/5.0' } })).text();
  // 找 axios 拦截器里 token 注入方式
  for (const kw of ['Authorization', 'token', 'cookie', 'Cookie', 'X-Token', 'access_token', 'ticket']) {
    const idxs = [];
    let i = -1;
    while ((i = bundle.indexOf(kw, i + 1)) !== -1 && idxs.length < 3) idxs.push(i);
    idxs.forEach(ix => {
      console.log('--- ' + kw + ' @' + ix + ' ---');
      console.log(bundle.slice(Math.max(0, ix - 120), ix + 160).replace(/\n/g, ' '));
    });
  }
}
main().catch(e => console.log('err', e.message));
