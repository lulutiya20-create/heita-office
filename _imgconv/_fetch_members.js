const GC_ID = '9392397760369529265';
async function main() {
  const url = 'https://apiff14risingstones.web.sdo.com/api/home/guild/getGuildMember?guild_id=' + GC_ID;
  const r = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36',
      Referer: 'https://ff14risingstones.web.sdo.com/pc/index.html',
      Origin: 'https://ff14risingstones.web.sdo.com'
    }
  });
  console.log('status:', r.status);
  const j = await r.json().catch(async () => ({ raw: (await r.text()).slice(0, 500) }));
  console.log('code:', j.code, 'msg:', j.msg || j.message);
  const d = j.data || {};
  const reg = d.registered || [], unreg = d.unRegister || [];
  console.log('registered:', reg.length, '| unRegister:', unreg.length);
  console.log('\n样例 registered[0]:', JSON.stringify(reg[0], null, 2));
  console.log('\n样例 unRegister[0]:', JSON.stringify(unreg[0], null, 2));
  console.log('\n全部角色名:');
  console.log(reg.map(m => m.character_name).join(', '));
  console.log(unreg.map(m => m.character_name).join(', '));
}
main().catch(e => console.log('err', e.message));
