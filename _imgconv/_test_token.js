const fs = require('fs');
const t = fs.readFileSync('C:/Users/Administrator/.git-credentials', 'utf8').match(/https:\/\/[^:]+:([^@]+)@/)[1];
const H = { 'User-Agent': 'check', Authorization: 'Bearer ' + t };

async function main() {
  let r = await fetch('https://api.github.com/user', { headers: H });
  console.log('GET /user:', r.status);
  if (r.status === 200) {
    const j = await r.json();
    console.log('login:', j.login);
  }
  r = await fetch('https://api.github.com/repos/lulutiya20-create/heita-office-images', { headers: H });
  console.log('GET repo:', r.status);
  const scopes = r.headers.get('x-github-scopes');
  if (scopes) console.log('scopes:', scopes);
  if (r.status !== 200) {
    const j = await r.json().catch(() => ({}));
    console.log('message:', j.message);
  }
}
main();
