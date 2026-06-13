import subprocess
import os
import time

os.chdir(r'C:\Users\Administrator\WorkBuddy\2026-06-12-18-25-30')

# 1. git add
r = subprocess.run(['git', 'add', '-A'], capture_output=True, text=True)
print('ADD:', r.returncode, r.stderr[:200] if r.stderr else '')

# 2. 检查是否有变更
r = subprocess.run(['git', 'status', '--porcelain'], capture_output=True, text=True)
if not r.stdout.strip():
    print('NO CHANGES TO COMMIT')
    exit(0)
print('CHANGES:', r.stdout[:500])

# 3. commit
msg = 'fix: 异步写入 Atlas,避免 PUT 阻塞/超时 (server.js writeToMongo→writeToMongoAsync)'
r = subprocess.run(['git', 'commit', '-m', msg], capture_output=True, text=True)
print('COMMIT:', r.returncode)
print('  stdout:', r.stdout[:300])
print('  stderr:', r.stderr[:300])

# 4. push master
env = os.environ.copy()
env['http_proxy'] = 'http://127.0.0.1:7897'
env['https_proxy'] = 'http://127.0.0.1:7897'
r = subprocess.run(['git', 'push', 'origin', 'master', '--force'], capture_output=True, text=True, env=env)
print('PUSH master:', r.returncode)
print('  stdout:', r.stdout[:400])
print('  stderr:', r.stderr[:400])

# 5. push main
r = subprocess.run(['git', 'push', 'origin', 'master:main', '--force'], capture_output=True, text=True, env=env)
print('PUSH main:', r.returncode)
print('  stdout:', r.stdout[:400])
print('  stderr:', r.stderr[:400])

# 6. 最终状态
r = subprocess.run(['git', 'log', '--oneline', '-3'], capture_output=True, text=True)
print('LOG:', r.stdout)
