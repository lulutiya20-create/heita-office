#!/usr/bin/env node
/**
 * 同步推送脚本：自动将本地 master 分支同步推送到 main 分支
 * 用法：node _push_both.js "commit message"
 * 或：node _push_both.js  （自动用占位 commit message）
 */
const { execSync } = require('child_process');

const PROXY = 'http://127.0.0.1:7897';
const env = { ...process.env, http_proxy: PROXY, https_proxy: PROXY };

function exec(cmd, opts = {}) {
  console.log('> ' + cmd);
  try {
    return execSync(cmd, { stdio: 'inherit', env, ...opts });
  } catch (e) {
    console.error('Command failed: ' + cmd);
    throw e;
  }
}

try {
  // 1. 检查当前分支
  const currentBranch = execSync('git rev-parse --abbrev-ref HEAD', { env }).toString().trim();
  console.log('当前分支:', currentBranch);

  if (currentBranch !== 'master' && currentBranch !== 'main') {
    console.error('❌ 当前不在 master/main 分支，请先切换');
    process.exit(1);
  }

  // 2. 拉取最新
  console.log('\n=== 拉取远程最新 ===');
  try {
    exec('git pull origin ' + currentBranch + ' --rebase');
  } catch (e) {
    console.warn('pull 失败（可能没有 upstream）');
  }

  // 3. 检查是否有待提交
  const status = execSync('git status --porcelain', { env }).toString().trim();
  if (status) {
    console.log('\n=== 检测到未提交的修改 ===');
    console.log(status);
    const msg = process.argv[2] || 'auto: ' + new Date().toISOString();
    exec('git add -A');
    exec('git commit -m "' + msg.replace(/"/g, '\\"') + '"');
  } else {
    console.log('\n✅ 工作区干净，无需提交');
  }

  // 4. 推送到当前分支
  console.log('\n=== 推送到 ' + currentBranch + ' ===');
  try {
    exec('git push origin ' + currentBranch);
  } catch (e) {
    // 第一次推送需要 --set-upstream
    exec('git push --set-upstream origin ' + currentBranch);
  }

  // 5. 同步推送到另一个分支
  const otherBranch = currentBranch === 'master' ? 'main' : 'master';
  console.log('\n=== 同步推送到 ' + otherBranch + ' ===');
  try {
    exec('git push origin HEAD:' + otherBranch);
  } catch (e) {
    console.warn('推送 ' + otherBranch + ' 失败，尝试 --force');
    exec('git push origin HEAD:' + otherBranch + ' --force');
  }

  // 6. 验证
  console.log('\n=== 验证远程 ===');
  exec('git ls-remote origin master main');

  console.log('\n✅ 同步推送完成！');
  console.log('提示：Render 会自动检测 main 分支变更并触发部署（约 2-3 分钟）');
} catch (e) {
  console.error('\n❌ 同步失败:', e.message);
  process.exit(1);
}
