# MongoDB Atlas 持久化修复 - commit 2d8b39f

## 核心改动
完全重写 server.js 的存储层，确保 MongoDB Atlas 真正能用作持久化后端。

## 新机制
1. **主动重连** — 启动后每 30 秒尝试连接 Atlas，连上后停止
2. **双写策略** — PUT 时同时写本地文件和 Atlas，任一失败不影响另一个
3. **智能回退** — Atlas 失败时本地兜底，重启 Render 不丢数据
4. **读策略** — Atlas 优先，失败回退本地，并触发重连
5. **手动同步** — 新增 POST /api/sync-to-atlas 接口
6. **状态可见** — API 响应增加 storage 字段，前端可看当前模式

## 部署验证步骤
1. 等待 Render 自动部署（~2-3 分钟）
2. 浏览器访问 https://heita-office.onrender.com/ 触发 Atlas 唤醒
3. 等待 30s 看到 Render 日志输出"✅ MongoDB Atlas 连接成功"
4. 之后访问 https://heita-office.onrender.com/api/health 确认 `mongo: true`
5. 此时 MongoDB Compass 中能看到最新的 25 成员数据

## 用户操作建议
- 部署完成后在 Render Dashboard 观察启动日志
- 如果看到 "MongoDB 连接失败"，检查 Atlas Network Access 是否真正生效
- 一旦连上，所有 PUT 都会双写，Compass 会立刻同步显示

## 变更文件
- `server.js`（重写 298 行）

## 数据流图
```
浏览器 PUT → Render Server 
                ├── 写本地 data.json (100% 成功)
                └── 写 MongoDB Atlas (如果连得上)
                        ↓ 失败
                触发后台重连 (每 30s)
                        ↓ 连上
                同步本地 data.json 到 Atlas
```
