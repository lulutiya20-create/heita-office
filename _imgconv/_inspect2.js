const fs = require('fs');
const s = fs.readFileSync('C:/Users/Administrator/WorkBuddy/2026-06-12-18-25-30/public/index.html', 'utf8').split(/\r?\n/);
function show(a, b, tag) {
  console.log('=== ' + tag + ' ===');
  console.log(s.slice(a - 1, b).map((l, i) => (a + i) + ': ' + l).join('\n'));
}
show(3636, 3700, 'render 开头+层级定位');
show(3780, 3870, '自动布局计算');
show(4085, 4115, '自动排列按钮函数');
