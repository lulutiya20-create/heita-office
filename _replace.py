import re

with open(r'C:\Users\Administrator\WorkBuddy\2026-06-12-18-25-30\public\index.html', 'r', encoding='utf-8') as f:
    html = f.read()

with open(r'C:\Users\Administrator\new_members.txt', 'r', encoding='utf-8') as f:
    new_members = f.read().rstrip()

pattern = r"  members:\[.*?  \],"
match = re.search(pattern, html, re.DOTALL)
if not match:
    print('ERROR: not found')
    exit(1)
print('Found old members at offset', match.start(), '-', match.end())
print('Old length:', match.end() - match.start())
print('New length:', len(new_members))

new_html = html[:match.start()] + new_members + html[match.end():]
with open(r'C:\Users\Administrator\WorkBuddy\2026-06-12-18-25-30\public\index.html', 'w', encoding='utf-8') as f:
    f.write(new_html)
print('Done. New file size:', len(new_html))
