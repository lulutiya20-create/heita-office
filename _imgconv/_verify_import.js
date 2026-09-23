const READ_KEY = '$2a$10$Htgjeu92rse90o7hAgF4V.G7dneKS6l6ylY8xOF92YOqzRb/COAp2';
async function main() {
  const r = await fetch('https://api.jsonbin.io/v3/b/6a2d8016f5f4af5e29ec2a66/latest', {
    headers: { 'X-Access-Key': READ_KEY, 'X-Bin-Meta': 'false' }
  });
  const d = await r.json();
  const app = d.record || d;
  console.log('members:', (app.members || []).length);
  console.log('mentors:', (app.mentors || []).length, '| relations kept:', (app.members||[]).filter(m=>(m.relations||[]).length).length, '人有关联');
  console.log('treeNodePositions:', Object.keys(app.treeNodePositions || {}).length, '个节点位置');
  // 抽查一个新导入成员
  const nm = (app.members || []).find(m => m.name === '萧萧雨欣');
  console.log('抽查新成员 萧萧雨欣:', JSON.stringify(nm));
  // 抽查老成员未被动过
  const old = (app.members || []).find(m => m.name === '米椛SAMA');
  console.log('抽查老成员 米椛SAMA:', old ? ('存在, relations=' + (old.relations || []).length + ', avatar=' + (old.avatar ? '有' : '无')) : '不存在');
}
main().catch(e => console.log('err', e.message));
