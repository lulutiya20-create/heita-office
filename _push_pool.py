import subprocess, os
os.chdir(r'C:\Users\Administrator\WorkBuddy\2026-06-12-18-25-30')

r = subprocess.run(['git', 'add', '-A'], capture_output=True, text=True)
r = subprocess.run(['git', 'status', '--porcelain'], capture_output=True, text=True)
print('CHANGES:', repr(r.stdout[:200]))
if not r.stdout.strip():
    print('NO CHANGES')
    exit(0)

msg = 'fix: 修复 Atlas 连接池被关闭 + ping 等待 topology ready'
r = subprocess.run(['git', 'commit', '-m', msg], capture_output=True, text=True)
print('COMMIT:', r.returncode, r.stdout[:200])

env = os.environ.copy()
env['http_proxy'] = 'http://127.0.0.1:7897'
env['https_proxy'] = 'http://127.0.0.1:7897'

r = subprocess.run(['git', 'push', 'origin', 'master', '--force'], capture_output=True, text=True, env=env)
print('PUSH master:', r.returncode, r.stderr[:200])

r = subprocess.run(['git', 'log', '--oneline', '-3'], capture_output=True, text=True)
print('LOG:', r.stdout)
