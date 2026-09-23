async function main() {
  await new Promise(r => setTimeout(r, 60000));
  for (let attempt = 1; attempt <= 4; attempt++) {
    const r = await fetch('https://lulutiya20-create.github.io/heita-office/?nocache=' + Date.now());
    const t = await r.text();
    const hasPurge = t.includes('purge.jsdelivr.net');
    console.log('attempt', attempt, 'status:', r.status, 'purge fix:', hasPurge);
    if (hasPurge) { console.log('DEPLOYED'); return; }
    await new Promise(r => setTimeout(r, 45000));
  }
  console.log('NOT YET - Pages build may still be in progress');
}
main().catch(e => console.log('err', e.message));
