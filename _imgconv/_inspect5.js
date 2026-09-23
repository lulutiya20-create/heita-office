const fs = require('fs');
const s = fs.readFileSync('C:/Users/Administrator/WorkBuddy/2026-06-12-18-25-30/public/index.html', 'utf8').split(/\r?\n/);
[2508, 2951, 2998].forEach(start => {
  console.log('=== lines ' + start + '-' + (start + 12) + ' ===');
  console.log(s.slice(start - 1, start + 12).map((l, i) => (start + i) + ': ' + l).join('\n'));
});
