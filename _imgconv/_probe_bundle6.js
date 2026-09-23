async function main() {
  const g = await (await fetch('https://ff14risingstones.web.sdo.com/pc/static/js/guild.BmapY44R.js', { headers: { 'User-Agent': 'Mozilla/5.0' } })).text();
  console.log('=== guild.js 全文 ===');
  console.log(g);
  // 也看下 GuildMember 页面全文找分页参数
  const chunk = await (await fetch('https://ff14risingstones.web.sdo.com/pc/static/js/GuildMember.BKi4s4NN.js', { headers: { 'User-Agent': 'Mozilla/5.0' } })).text();
  console.log('=== GuildMember.js 关键片段 ===');
  console.log(chunk.slice(0, 4800));
}
main().catch(e => console.log('err', e.message));
