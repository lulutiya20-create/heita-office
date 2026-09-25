const fs = require('fs');
const dir = 'C:/Users/Administrator/WorkBuddy/2026-06-12-18-25-30/.workbuddy/memory';
const f = dir + '/2026-09-25.md';
const note = '\n## 2026-09-25 统一风格对话框替代原生弹窗 (commit 748b3fc)\n' +
'- 用户反馈原生 prompt() 弹窗(修改密码/新建相册等)与站点风格割裂 → 建 uiPrompt/uiConfirm 组件(FF14主题深色卡+金色标题+顶部金线+毛玻璃遮罩 z-index:5000)\n' +
'- API: uiPrompt({title,label,value,placeholder,password,okText,danger})→Promise<string|null>; uiConfirm({title,message,okText,danger})→Promise<boolean>; 危险操作加 danger:true 红色按钮(.btn-danger); Enter确定/Esc取消/点遮罩取消\n' +
'- 19处调用点全部替换为 async/await(含 reader.onload 改 async); 全站已无原生 prompt/confirm; playwright 验证 Promise resolve/cancel/Esc 全通过\n' +
'- 要点: onclick 直接调 async 函数没问题; 替换 confirm 时同步函数要标 async; 测试对话框可用 playwright page.evaluate 直接调页面函数(与 agent-browser 的隔离世界不同)\n';
fs.appendFileSync(f, note);
console.log('ok');
