const fs = require('fs');
const html = fs.readFileSync('C:/Users/Administrator/WorkBuddy/2026-06-12-18-25-30/public/index.html', 'utf8');
// Extract all inline <script> blocks and syntax-check them
const blocks = [];
const re = /<script(?![^>]*src)[^>]*>([\s\S]*?)<\/script>/gi;
let m;
while ((m = re.exec(html)) !== null) blocks.push(m[1]);
console.log('script blocks:', blocks.length);
const vm = require('vm');
let ok = true;
blocks.forEach((code, i) => {
  try { new vm.Script(code, { filename: 'block' + i }); }
  catch (e) { ok = false; console.log('SYNTAX ERROR in block', i, ':', e.message); }
});
console.log(ok ? 'ALL OK' : 'ERRORS FOUND');
