const fs = require('fs');
const t = fs.readFileSync('C:/Users/Administrator/.git-credentials', 'utf8').match(/https:\/\/[^:]+:([^@]+)@/)[1];
fs.writeFileSync(
  'C:/Users/Administrator/WorkBuddy/2026-06-12-18-25-30/_imgconv/gh-token-copy.txt',
  '你的 GitHub Token（lulutiya20-create）：\r\n\r\n' + t + '\r\n\r\n说明：2026-09-23 验证有效，可整段复制粘贴到网页「图片导入」的 Token 输入框。\r\n'
);
console.log('written, token length:', t.length);
