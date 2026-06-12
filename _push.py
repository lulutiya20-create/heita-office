import subprocess, os
os.environ['GIT_HTTP_PROXY'] = 'http://127.0.0.1:7897'
os.environ['GIT_HTTPS_PROXY'] = 'http://127.0.0.1:7897'

files = ['server.js', 'public/index.html', 'package.json', 'package-lock.json']
r1 = subprocess.run(['git', 'add'] + files, capture_output=True)
print('Git add done')

r2 = subprocess.run(
    ['git', 'commit', '-m', 'feat: add MongoDB Atlas support to server.js'],
    capture_output=True, encoding='utf-8', errors='replace'
)
print('Commit stdout:', r2.stdout[:200] if r2.stdout else '(empty)')
print('Commit stderr:', r2.stderr[:200] if r2.stderr else '(empty)')

r3 = subprocess.run(
    ['git', 'push', 'origin', 'master'],
    capture_output=True, encoding='utf-8', errors='replace', timeout=30
)
print('Push stdout:', r3.stdout[:300] if r3.stdout else '(empty)')
print('Push stderr:', r3.stderr[:300] if r3.stderr else '(empty)')
print('Push return code:', r3.returncode)
