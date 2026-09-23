const fs = require('fs');
const s = fs.readFileSync('C:/Users/Administrator/WorkBuddy/2026-06-12-18-25-30/public/index.html', 'utf8').split(/\r?\n/);
// 登录校验逻辑
s.forEach((l, i) => {
  if (/function\s+\w*[lL]ogin\w*\(|password\s*===|\.password\s*==|密码错误|角色名称或密码/.test(l))
    console.log((i + 1) + ': ' + l.trim().slice(0, 160));
});
console.log('\n=== 管理面板成员编辑表单 password 相关 ===');
s.forEach((l, i) => {
  if (/adm.*[Pp]assword|admEdit|admSave|editMember|memberPass/.test(l))
    console.log((i + 1) + ': ' + l.trim().slice(0, 160));
});
