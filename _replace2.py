import json
import re

with open(r'public/index.html', 'r', encoding='utf-8') as f:
    html = f.read()

with open(r'C:\Users\Administrator\Downloads\黑塔办事处_数据备份_2026-06-13 (1).json', encoding='utf-8') as f:
    data = json.load(f)

# 构建 events 段 (备份是 0 事件, 用占位图)
new_events = "  events:[\n"
new_events += "    {id:1,title:'黑塔办事处正式成立',date:'2026-04-01',description:'黑塔办事处成立日,欢迎所有成员加入这个温暖的大家庭。',image:'https://picsum.photos/seed/event1/600/400'},\n"
new_events += "    {id:2,title:'2026年春季团建',date:'2026-05-15',description:'春季团建活动圆满结束,期待下次相聚!',image:'https://picsum.photos/seed/event2/600/400'},\n"
new_events += "    {id:3,title:'2026年夏季活动',date:'2026-06-20',description:'夏季活动即将开始,敬请期待!',image:'https://picsum.photos/seed/event3/600/400'}\n"
new_events += "  ],"

# 构建 mentors 段 (用简化版, 不放 base64 image)
mentors = data.get('mentors', [])
new_mentors = "  mentors:[\n"
for i, mt in enumerate(mentors):
    mid = mt.get('memberId', 0)
    sp = mt.get('specialty', '')
    ei = (mt.get('extraInfo', '') or '')[:60]
    line = "    {id:" + str(mt.get('id', i+1)) + ",memberId:" + str(mid) + ",specialty:'" + sp.replace("'", "\'") + "',extraInfo:'" + ei.replace("'", "\'") + "',image:'https://picsum.photos/seed/mentor" + str(mid) + "/400/400'}"
    if i < len(mentors) - 1:
        line += ","
    new_mentors += line + "\n"
new_mentors += "  ],"

# 构建 messages 段
msgs = data.get('messages', [])
new_messages = "  messages:[\n"
for i, m in enumerate(msgs):
    name = m.get('name', '').replace("'", "\'")
    content = m.get('content', '').replace("'", "\'")
    time = m.get('time', '')
    line = "    {id:" + str(m.get('id', i+1)) + ",name:'" + name + "',content:'" + content + "',time:'" + time + "'}"
    if i < len(msgs) - 1:
        line += ","
    new_messages += line + "\n"
new_messages += "  ],"

# 替换 events
html = re.sub(r"  events:\[.*?  \],", new_events, html, count=1, flags=re.DOTALL)
# 替换 mentors
html = re.sub(r"  mentors:\[.*?  \],", new_mentors, html, count=1, flags=re.DOTALL)
# 替换 messages
html = re.sub(r"  messages:\[.*?  \],", new_messages, html, count=1, flags=re.DOTALL)

with open(r'public/index.html', 'w', encoding='utf-8') as f:
    f.write(html)
print('Done. File size:', len(html))
