const fs = require('fs');
const s = fs.readFileSync('C:/Users/Administrator/WorkBuddy/2026-06-12-18-25-30/public/index.html', 'utf8').split(/\r?\n/);
function show(a, b, tag) {
  console.log('=== ' + tag + ' ===');
  console.log(s.slice(a - 1, b).map((l, i) => (a + i) + ': ' + l).join('\n'));
}
show(3700, 3782, 'computeFtLayout');
show(3870, 3990, 'startFtDrag/onFtDragMove/onFtDragEnd');
show(3990, 4085, 'dock drag drop + dblclick');
show(564, 596, 'familytree HTML actions');
