import subprocess, os
os.environ['GIT_HTTP_PROXY'] = 'http://127.0.0.1:7897'
os.environ['GIT_HTTPS_PROXY'] = 'http://127.0.0.1:7897'
cwd = r'C:\Users\Administrator\WorkBuddy\2026-06-12-18-25-30'

# Verify file has our changes
with open(cwd + r'\public\index.html', 'r', encoding='utf-8') as f:
    content = f.read()
has_pcOverlay = 'pcOverlay' in content
has_heita_login = 'heita_login' in content
print('pcOverlay in file:', has_pcOverlay)
print('heita_login in file:', has_heita_login)

if not has_pcOverlay:
    print('ERROR: changes not saved to file!')
    exit(1)

# Force add
r = subprocess.run(['git', 'add', '-f', 'public/index.html'], capture_output=True, text=True, cwd=cwd)
print('Add:', r.stdout.strip() or r.stderr.strip())

# Commit
r2 = subprocess.run(['git', 'commit', '-m', 'fix: 个人中心独立遮罩层修复闪退Bug + 登录状态持久化'], capture_output=True, text=True, cwd=cwd)
print('Commit:', r2.stdout.strip() or r2.stderr.strip())

# Push
r3 = subprocess.run(['git', 'push', 'origin', 'master'], capture_output=True, text=True, timeout=30, cwd=cwd)
print('Push master:', r3.stdout.strip() or r3.stderr.strip())

r4 = subprocess.run(['git', 'push', 'origin', 'master:main'], capture_output=True, text=True, timeout=30, cwd=cwd)
print('Push main:', r4.stdout.strip() or r4.stderr.strip())
