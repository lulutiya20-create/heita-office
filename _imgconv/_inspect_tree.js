// 检查关系数据结构与布局相关代码
const fs = require('fs');
const s = fs.readFileSync('C:/Users/Administrator/WorkBuddy/2026-06-12-18-25-30/public/index.html', 'utf8').split(/\r?\n/);

// 1) 关系数据结构关键词
console.log('=== 关系/位置相关行 ===');
s.forEach((l, i) => {
  if (/relation|parentId|parent_id|treeNodePositions|relations\s*[:=]/i.test(l))
    console.log((i + 1) + ': ' + l.trim().slice(0, 160));
});

// 2) 找 nodeW/nodeH 常量与 render 函数
console.log('\n=== 节点尺寸常量 ===');
s.forEach((l, i) => {
  if (/NODE_W|NODE_H|nodeW|nodeH/.test(l))
    console.log((i + 1) + ': ' + l.trim().slice(0, 140));
});
