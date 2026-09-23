const READ_KEY = '$2a$10$Htgjeu92rse90o7hAgF4V.G7dneKS6l6ylY8xOF92YOqzRb/COAp2';
const BIN = '6a2d8016f5f4af5e29ec2a66';

function short(u) { return u && u.length > 80 ? u.slice(0, 60) + '...' + u.slice(-15) : u; }

async function fetchRetry(url, opts, tries = 4) {
  for (let i = 1; i <= tries; i++) {
    try { return await fetch(url, opts); }
    catch (e) { console.log('retry', i, e.message); await new Promise(r => setTimeout(r, 2000)); }
  }
  throw new Error('fetch failed after retries');
}

async function main() {
  const r = await fetchRetry('https://api.jsonbin.io/v3/b/' + BIN + '/latest', {
    headers: { 'X-Access-Key': READ_KEY, 'X-Bin-Meta': 'false' }
  }, 5);
  console.log('jsonbin status:', r.status);
  if (r.status !== 200) { console.log(await r.text()); return; }
  const data = await r.json();
  const mentors = data.mentors || [];
  console.log('mentors:', mentors.length);
  for (const mt of mentors) {
    const imgs = [];
    for (const f of ['image', 'avatar', 'photo', 'img']) {
      if (mt[f]) imgs.push(f + '=' + short(mt[f]));
    }
    console.log('-', (mt.name || mt.id || mt.memberId || '?') + ':', imgs.join(' | ') || '(no image field)');
  }
}
main().catch(e => console.log('err', e.message));
