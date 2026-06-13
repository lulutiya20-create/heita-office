import subprocess, os
os.chdir(r'C:\Users\Administrator\WorkBuddy\2026-06-12-18-25-30')
env = os.environ.copy()
env['http_proxy'] = 'http://127.0.0.1:7897'
env['https_proxy'] = 'http://127.0.0.1:7897'
r = subprocess.run(['git', 'push', 'origin', 'master:main', '--force'], capture_output=True, text=True, env=env)
print('PUSH main:', r.returncode, r.stdout[:200], r.stderr[:200])
r = subprocess.run(['git', 'ls-remote', 'origin', 'main', 'master'], capture_output=True, text=True)
print('REMOTE:')
print(r.stdout)
