import subprocess, os
os.environ['GIT_HTTP_PROXY'] = 'http://127.0.0.1:7897'
os.environ['GIT_HTTPS_PROXY'] = 'http://127.0.0.1:7897'
cwd = r'C:\Users\Administrator\WorkBuddy\2026-06-12-18-25-30'

# Check status
r = subprocess.run(['git','status','--short'], capture_output=True, text=True, cwd=cwd)
print('Git status:', r.stdout.strip() if r.stdout.strip() else '(clean)')

# Add and commit
subprocess.run(['git','add','public/index.html'], cwd=cwd)
r2 = subprocess.run(['git','commit','-m','fix: 个人中心独立遮罩层修复闪退Bug + 登录状态持久化'], capture_output=True, text=True, cwd=cwd)
print('Commit:', r2.stdout.strip() or r2.stderr.strip())

# Push master
r3 = subprocess.run(['git','push','origin','master'], capture_output=True, text=True, timeout=30, cwd=cwd)
print('Push master:', r3.stdout.strip() or r3.stderr.strip())

# Push master to main
r4 = subprocess.run(['git','push','origin','master:main'], capture_output=True, text=True, timeout=30, cwd=cwd)
print('Push main:', r4.stdout.strip() or r4.stderr.strip())
