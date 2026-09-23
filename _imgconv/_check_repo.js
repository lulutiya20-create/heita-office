async function main() {
  // 1) Recent commits on heita-office-images
  const r = await fetch('https://api.github.com/repos/lulutiya20-create/heita-office-images/commits?per_page=10', {
    headers: { 'User-Agent': 'check', Accept: 'application/vnd.github+json' }
  });
  console.log('commits status:', r.status);
  if (r.status === 200) {
    for (const c of await r.json()) {
      console.log('-', c.commit.author.date, '|', c.commit.message.slice(0, 60), '|', c.sha.slice(0, 7));
    }
  }
  // 2) mentors/ directory listing
  const r2 = await fetch('https://api.github.com/repos/lulutiya20-create/heita-office-images/contents/mentors', {
    headers: { 'User-Agent': 'check', Accept: 'application/vnd.github+json' }
  });
  console.log('\nmentors/ status:', r2.status);
  if (r2.status === 200) {
    for (const f of await r2.json()) {
      console.log('-', f.name, (f.size / 1024).toFixed(0) + 'KB');
    }
  }
}
main().catch(e => console.log('err', e.message));
