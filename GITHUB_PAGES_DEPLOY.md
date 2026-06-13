# 部署到 GitHub Pages 步骤

## 1. 启用 GitHub Pages

1. 打开 https://github.com/lulutiya20-create/heita-office/settings/pages
2. **Source**: 选 `Deploy from a branch`
3. **Branch**: 选 `main` 分支
4. **Folder**: 选 `/public` 文件夹
5. 点 **Save**
6. 等待 1-2 分钟，GitHub 会给你一个地址：
   ```
   https://lulutiya20-create.github.io/heita-office/
   ```

## 2. 注册 JSONBin.io（一次性）

1. 打开 https://jsonbin.io/
2. 点右上角 "Sign Up" / "Get Started for Free"
3. 用邮箱注册（**不绑卡**）
4. 登录后到 Dashboard

## 3. 创建第一个 Bin

1. 在 JSONBin Dashboard 点 "Create New Bin" 或 "Create"
2. **Name**: `heita-office-data`
3. **Visibility**: 
   - `Public` （最简单，URL 里暴露 bin id）
   - `Private` （更安全，但需要 master key 才能访问）
4. 点 Create
5. 记录两个值：
   - **Bin ID** （在 URL 里，例如 `65a1234abcd5678ef9012345`）
   - **Master Key** （在 Bin 设置里，格式 `$2b$10$...`）

## 4. 第一次访问 + 配置

1. 打开 https://lulutiya20-create.github.io/heita-office/
2. 页面会正常显示 27 成员（来自 DEFAULTS）
3. 点底部 **"📤 同步"** 按钮 → 选 **"☁️ JSONBin 配置"**
4. 填入：
   - Bin ID
   - Master Key
   - 轮询间隔：建议 `300` 秒（5 分钟，每月约 8640 次请求，免费层内）
5. 点 **"🔌 测试连接"** → 应显示 ✅
6. 点 **"保存"** → 页面自动刷新，从 JSONBin 拉取数据

## 5. 多设备共享同步

**任何设备**，只要：
1. 访问同一个 GitHub Pages URL
2. 在同步菜单填入 **相同的 Bin ID + Master Key**
3. 自动 5 分钟轮询同步一次

**所有设备共享同一份数据**。

## 6. 数据迁移

如果你电脑里有 `黑塔办事处_数据备份_2026-06-13 (1).json`（27 成员完整版）：

1. 打开 GitHub Pages 地址
2. 管理员登录（默认 admin / admin123）
3. 点 "导入备份" 按钮
4. 选 4MB 的备份 JSON
5. 系统会自动推送到 JSONBin

**完成后所有设备 5 分钟内同步**。

## 7. 保活（防止 GitHub Pages 休眠）

GitHub Pages 一般不会休眠，但为安全起见：
1. 注册 https://uptimerobot.com （免费）
2. 添加 HTTP(s) 监控
3. URL: `https://lulutiya20-create.github.io/heita-office/api/health`
4. 间隔：5 分钟

## 8. 流量估算

| 轮询间隔 | 月请求数 | 状态 |
|----------|---------|------|
| 60 秒 | 43,200 | ❌ 超 10K 限额 |
| 180 秒（3 分钟） | 14,400 | ❌ 略超 |
| 300 秒（5 分钟） | 8,640 | ✅ 安全 |
| 600 秒（10 分钟） | 4,320 | ✅ 超安全 |

**建议 5 分钟轮询**，既能保证同步及时，又在免费层内。

## 9. 数据安全

- **JSONBin Public Bin**: 任何知道 Bin ID 的人都能读，**但不能写**（需要 Master Key 写）
- **JSONBin Private Bin**: 需要认证才能读写
- **Master Key** 是写权限，泄露后别人能改你数据
- 建议：定期更换 Master Key，旧的 push 用 force=true 覆盖

## 10. 故障排查

### Q: 测试连接失败 "401"
- A: Master Key 错了，去 JSONBin Dashboard 重新复制

### Q: 测试连接失败 "404"
- A: Bin ID 错了，去 JSONBin Dashboard 看 URL 里的 ID

### Q: 保存后页面没刷新
- A: 手动按 Ctrl+F5 强制刷新

### Q: 设备A改了，设备B没看到
- A: 等 5 分钟（轮询周期）
- A: 或点 "🔄 拉取云端" 按钮立即同步
- A: 检查 B 设备的 JSONBin 配置是否和 A 一致
