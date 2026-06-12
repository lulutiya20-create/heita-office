import subprocess, os
os.environ['GIT_HTTP_PROXY'] = 'http://127.0.0.1:7897'
os.environ['GIT_HTTPS_PROXY'] = 'http://127.0.0.1:7897'

r = subprocess.run(['git', 'status', '--short'], capture_output=True, text=True, cwd=r'C:\Users\Administrator\WorkBuddy\2026-06-12-18-25-30')
print('Status:', r.stdout if r.stdout.strip() else '(clean)')

r2 = subprocess.run(['git', 'log', '--oneline', '-1'], capture_output=True, text=True, cwd=r'C:\Users\Administrator\WorkBuddy\2026-06-12-18-25-30')
print('HEAD:', r2.stdout.strip())
