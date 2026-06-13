# 黑塔办事处 - 部署到 Koyeb 完整步骤

## 1. 注册 Koyeb 账号
- 访问 https://www.koyeb.com
- 点 "Get started for free"
- 用 GitHub 账号登录（推荐，与 GitHub 仓库无缝集成）
- **不需要绑信用卡**！

## 2. 创建新服务
- 登录后点 "Create Web Service"
- 选择 "GitHub" 部署方式
- 授权 Koyeb 访问你的 GitHub（选 lulutiya20-create）
- 选仓库: `lulutiya20-create/heita-office`
- 分支: `main`（或 master，看你哪个分支是最新代码）

## 3. 配置构建设置
Koyeb 会自动检测 Node.js 项目。检查以下设置：

| 设置项 | 值 |
|--------|-----|
| Builder | Buildpack（自动） |
| Run command | `node server.js` |
| Port | 8000（Koyeb 默认） |
| Region | fra (Frankfurt) 或 sin (Singapore) |
| Instance type | **Free (nano)** |

## 4. 配置环境变量（关键！）

点 "Environment variables"，添加：

| 名称 | 值 | 备注 |
|------|-----|------|
| `MONGODB_URI` | `mongodb+srv://heita-admin:HeitaOffice2026@cluster0.xc6yvnr.mongodb.net/?appName=Cluster0` | **必填** - 从 MongoDB Atlas 复制 |
| `DISABLE_MONGODB` | （留空） | 留空 = 启用 Atlas |
| `NODE_ENV` | `production` | 推荐 |

> ⚠️ **密码 URL 编码提醒**：如果密码含 `@` `#` `:` `/` 等特殊字符，需要 URL 编码：
> - `@` → `%40`
> - `#` → `%23`
> - `:` → `%3A`
> - `/` → `%2F`
>
> 例如密码 `P@ssw#rd:1` 编码后是 `P%40ssw%23rd%3A1`

## 5. 配置健康检查

在 "Health checks" 区域：

| 设置项 | 值 |
|--------|-----|
| Type | HTTP |
| Path | `/api/health` |
| Port | `8000` |
| Grace period | `30s` |
| Interval | `30s` |
| Timeout | `5s` |

## 6. 端口设置

Koyeb 默认使用 `PORT` 环境变量，代码会读取这个变量。确保你的 `server.js` 里有：

```js
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log('Server on', PORT));
```

（当前代码已用 `process.env.PORT`，无需修改）

## 7. 部署

- 点 "Deploy"
- Koyeb 会拉取 GitHub 仓库代码
- 自动 `npm install` 安装依赖
- 启动 `node server.js`
- 大约 2-3 分钟完成

## 8. 验证部署

部署成功后，Koyeb 会分配一个域名，例如：

```
https://heita-office-你的用户名.koyeb.app
```

测试：
```bash
curl https://heita-office-你的用户名.koyeb.app/api/health
# 期望: {"ok":true,"mongo":true,"timestamp":"..."}
```

打开浏览器访问，应该看到 27 成员黑塔办事处首页。

## 9. 配置自定义域名（可选）

- 在服务详情页点 "Domains"
- 点 "Add domain"
- 输入你的域名（如 `office.example.com`）
- Koyeb 会给出 CNAME 记录
- 到你的域名 DNS 服务商添加该记录
- 5-30 分钟后自动签发 SSL 证书

## 10. 流量监控

- 服务详情页 → "Metrics" 标签
- 可以看到实时带宽、请求数、错误率
- 5GB 流量用完前 Koyeb 会发邮件提醒

## 11. 防止服务挂起（Koyeb 不会挂起但建议加保活）

Koyeb 免费层 24/7 不休眠，不需要保活。但如果你想：
- 注册 https://uptimerobot.com
- 添加 HTTP 监控，5 分钟 ping 一次
- 流量 0 成本 + 监控可用性

## 12. 回滚到 Render（如需要）

Render 在 7 月 1 日会重置流量，彼时可以：
1. 去 Render dashboard "Resume Service"
2. 重新部署（用同一份 GitHub 代码）
3. 改 DNS 切回 Render

## 常见问题

### Q: Koyeb 部署失败，看 Logs 报 ECONNREFUSED
A: 检查 MONGODB_URI 是否正确，密码是否 URL 编码

### Q: Koyeb 部署成功但 /api/health 返回 503
A: Atlas IP 白名单没加 0.0.0.0/0。修复：
   1. 去 https://cloud.mongodb.com
   2. Network Access → Add IP Address
   3. 选 "Allow Access from Anywhere" (0.0.0.0/0)
   4. 等待 1-2 分钟生效

### Q: 数据怎么从 Render 迁过来？
A: 当前数据在 Render data.json (临时) + MongoDB Atlas (永久) + 你电脑本地 (备份)
   - **不需要迁移**：直接用同一份 MONGODB_URI，Koyeb 会从 Atlas 读到 27 成员
   - 如果 Atlas 仍反滥用：在你的浏览器 localStorage 应该有 27 成员，登录后会自动同步到 Koyeb → Atlas

### Q: 5GB 流量够用吗？
A: 已经优化：
   - 轮询从 5 秒改为 **60 秒**（节省 12 倍流量）
   - 用 `?poll=N` 参数可自定义
   - 加 UptimeRobot 保活也只占少量流量
   - 预计 5GB 够 3-6 个月

### Q: 想用 Koyeb CLI 部署？
```bash
# 安装 CLI
curl -fsSL https://raw.githubusercontent.com/koyeb/koyeb-cli/main/install.sh | bash

# 登录
koyeb login

# 部署
koyeb service deploy koyeb.yaml
```

---

**Koyeb 部署后访问地址示例**：
```
https://heita-office-你的用户名.koyeb.app
```

部署过程中遇到任何问题，截图给我看！
