import subprocess, os, time
os.chdir(r'C:\Users\Administrator\WorkBuddy\2026-06-12-18-25-30')

env = os.environ.copy()
env['http_proxy'] = 'http://127.0.0.1:7897'
env['https_proxy'] = 'http://127.0.0.1:7897'

for attempt in range(3):
    r = subprocess.run(['git', 'push', 'origin', 'master', '--force'], capture_output=True, text=True, env=env)
    print(f'PUSH master attempt {attempt+1}:', r.returncode)
    print('  stdout:', r.stdout[:200])
    print('  stderr:', r.stderr[:200])
    if r.returncode == 0:
        break
    time.sleep(3)

# push main
r = subprocess.run(['git', 'push', 'origin', 'master:main', '--force'], capture_output=True, text=True, env=env)
print('PUSH main:', r.returncode, r.stderr[:200])

r = subprocess.run(['git', 'log', '--oneline', '-3'], capture_output=True, text=True)
print('LOG:', r.stdout)
