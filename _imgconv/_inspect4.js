const fs = require('fs');
const s = fs.readFileSync('C:/Users/Administrator/WorkBuddy/2026-06-12-18-25-30/public/index.html', 'utf8').split(/\r?\n/);
function show(a, b, tag) {
  console.log('=== ' + tag + ' ===');
  console.log(s.slice(a - 1, b).map((l, i) => (a + i) + ': ' + l).join('\n'));
}
show(4109, 4165, 'toggleFtAdmin 完整');
// normalizeDataTypes
let i = s.findIndex(l => l.includes('function normalizeDataTypes'));
if (i >= 0) show(i + 1, i + 30, 'normalizeDataTypes');
// ftResetBtn 显隐控制
s.forEach((l, idx) => { if (/ftResetBtn/.test(l)) console.log('BTNREF ' + (idx + 1) + ': ' + l.trim().slice(0, 140)); });
