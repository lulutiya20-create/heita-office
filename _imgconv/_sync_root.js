const fs = require('fs');
fs.copyFileSync(
  'C:/Users/Administrator/WorkBuddy/2026-06-12-18-25-30/public/index.html',
  'C:/Users/Administrator/WorkBuddy/2026-06-12-18-25-30/index.html'
);
console.log('copied, root size:', fs.statSync('C:/Users/Administrator/WorkBuddy/2026-06-12-18-25-30/index.html').size);
