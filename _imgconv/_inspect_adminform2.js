const fs = require('fs');
const s = fs.readFileSync('C:/Users/Administrator/WorkBuddy/2026-06-12-18-25-30/public/index.html', 'utf8').split(/\r?\n/);
function show(a, b, tag) {
  console.log('=== ' + tag + ' ===');
  console.log(s.slice(a - 1, b).map((l, i) => (a + i) + ': ' + l).join('\n'));
}
show(710, 745, 'adm-members tab HTML');
show(3160, 3245, '统一处理添加/编辑成员');
show(3445, 3470, 'adm-m-list 渲染');
