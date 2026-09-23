const fs = require('fs');
const s = fs.readFileSync('C:/Users/Administrator/WorkBuddy/2026-06-12-18-25-30/public/index.html', 'utf8').split(/\r?\n/);
// 找管理员成员编辑表单
s.forEach((l, i) => {
  if (/adm-member|admMember|编辑成员|保存成员|function adm\w*Save|function adm\w*Edit|function admAddMember|memberForm/i.test(l))
    console.log((i + 1) + ': ' + l.trim().slice(0, 170));
});
