const fs = require('fs');
// 1) .git-credentials
try {
  const t = fs.readFileSync('C:/Users/Administrator/.git-credentials', 'utf8');
  for (const l of t.split(/\r?\n/).filter(Boolean)) {
    const m = l.match(/https:\/\/([^:]+):([^@]+)@/);
    if (m) console.log('git-credentials: user=' + m[1] + ' token=' + m[2].slice(0, 8) + '...' + m[2].slice(-4) + ' len=' + m[2].length);
  }
} catch (e) { console.log('git-credentials: missing'); }
// 2) keys.json
try {
  const k = JSON.parse(fs.readFileSync('C:/Users/Administrator/WorkBuddy/2026-06-12-18-25-30/_imgconv/keys.json', 'utf8'));
  const mask = (v) => typeof v === 'string' && v.length > 12 ? v.slice(0, 8) + '...' + v.slice(-4) + ' len=' + v.length : v;
  for (const [key, val] of Object.entries(k)) {
    if (/token|key|pat/i.test(key)) console.log('keys.json:', key, '=', mask(val));
    else console.log('keys.json:', key, '=', JSON.stringify(val).slice(0, 100));
  }
} catch (e) { console.log('keys.json: missing or unreadable: ' + e.message); }
