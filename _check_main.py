import subprocess, os
os.chdir(r'C:\Users\Administrator\WorkBuddy\2026-06-12-18-25-30')

# 查看 main 分支的实际位置
r = subprocess.run(['git', 'ls-remote', 'origin', 'main', 'master'], capture_output=True, text=True)
print('REMOTE branches:')
print(r.stdout)
