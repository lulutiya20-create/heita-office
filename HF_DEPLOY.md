# HuggingFace Spaces 部署黑塔办事处 - 详细步骤

## 1. 注册账号（2 分钟）
- 访问 https://huggingface.co/join
- 用邮箱注册（**不需要绑信用卡**）
- 验证邮箱后登录

## 2. 创建 Space（1 分钟）
- 右上角点 "+" → "New Space"
- 填写信息：

| 字段 | 值 |
|------|-----|
| Space name | `heita-office`（或你喜欢的） |
| License | MIT |
| SDK | **Docker**（不是 Gradio/Streamlit） |
| Space hardware | **CPU basic - free** |
| Visibility | Public（公开） |

点 "Create Space" 按钮。

## 3. 上传代码（3 种方式选 1）

### 方式 A：连接 GitHub（最推荐）
1. 在 Space 页面点 "Files" 标签
2. 点 "Add file" → "Connect a GitHub repository"
3. 授权 HuggingFace 访问你的 GitHub
4. 选仓库 `lulutiya20-create/heita-office`
5. 分支选 `main`
6. 点 "Connect"

### 方式 B：手动上传（如果不用 GitHub）
1. 在本地项目目录准备 zip：
   ```bash
   # Windows PowerShell
   Compress-Archive -Path * -DestinationPath heita-office.zip -Exclude node_modules, .git, data.json, *.tmp
   ```
2. Space 页面 → "Files" → "Add file" → "Upload files"
3. 把 zip 解压后所有文件拖进去

### 方式 C：直接 git push（适合有 git 经验）
1. 在 Space 页面右上角 "Clone" 按钮获取仓库地址
2. 本地：
   ```bash
   git remote add hf https://huggingface.co/spaces/你的用户名/heita-office
   git push hf main
   ```
   （如果你的主分支是 master，先 `git push hf master:main`）

## 4. 配置环境变量（关键！）
1. Space 页面 → "Settings" 标签
2. 左侧 "Variables and secrets"
3. 点 "New variable" 添加：

| 名称 | 类型 | 值 |
|------|------|-----|
| `MONGODB_URI` | Secret | `mongodb+srv://heita-admin:HeitaOffice2026@cluster0.xc6yvnr.mongodb.net/?appName=Cluster0` |
| `PORT` | (选 Variable) | `7860` |

4. 点 "Save" 触发重新构建

## 5. 等待构建（3-5 分钟）
- Space 页面 → "Logs" 标签查看构建进度
- 看到 "Building Docker image..."
- 看到 "Installing dependencies..."
- 最后看到 "黑塔办事处服务器已启动: http://0.0.0.0:7860"

## 6. 访问你的应用
- Space 页面右上角点 "App" 标签
- 看到首页 → 部署成功！
- 完整 URL：`https://huggingface.co/spaces/你的用户名/heita-office`

## 7. 验证部署
```bash
curl https://你的用户名-heita-office.hf.space/api/health
# 期望: {"ok":true,"mongo":true,"timestamp":"..."}
```

## ⚠️ 重要注意事项

### A. HuggingFace 闲置策略
- **48 小时无访问会进入 sleep 模式**
- 解决方案：注册 https://uptimerobot.com 加保活
- 或者用 GitHub Actions 每小时 ping 一次

### B. MongoDB Atlas IP 白名单
- HuggingFace 服务器 IP 不固定
- 在 Atlas 控制台 → Network Access → 选 "Allow Access from Anywhere" (0.0.0.0/0)

### C. 端口
- HuggingFace Spaces **必须用 7860**（已经默认设置好）
- Dockerfile 里 `EXPOSE 7860` + server.js 默认 3000 + 我们加了 HOST 绑定
- 如果仍有问题，HF 会自动设置 `PORT=7860` 环境变量

### D. 数据持久化
- HF 容器重启会清空 data.json
- **MongoDB Atlas 是唯一持久层**
- 27 成员一旦 PUT 到 Atlas，重启也不会丢

## 🔄 数据迁移流程

1. 部署成功后，访问你的 HF Space URL
2. 第一次打开：
   - localStorage 可能是空的
   - Atlas 也可能没数据（之前反滥用）
3. 解决方案：
   - 浏览器访问 Render（如果恢复了）：导出 27 成员备份
   - 或用你电脑里的 `黑塔办事处_数据备份_2026-06-13 (1).json`
   - 在 HF 部署的应用上登录管理员 → 控制台 → "导入备份"

## ❓ 常见问题

### Q: 构建失败说 "no space-yaml file"
A: 我们用 `Dockerfile` 不是 `README.md` frontmatter。删除 README 的 YAML 头？
   答：保留 YAML 头也行，HF 会优先用 Dockerfile
   注意 README 顶部已有 `---\nyaml\n---\n` 配置

### Q: 应用显示 "Application is starting..."
A: 第一次冷启动需要 30-60 秒，等待即可

### Q: MongoDB 连接失败
A: 检查 `MONGODB_URI` 是否正确，注意特殊字符 URL 编码

### Q: 容器重启后数据没了
A: 正常！HF 容器无持久磁盘，必须靠 Atlas 持久化
   解决方法：让所有客户端先 PUT 到 Atlas，HF 容器只是 proxy

## 🎯 部署成功的标志

打开 HF Space URL 看到：
- ✅ 首页加载（轮播图、导航卡片）
- ✅ 27 成员可见（如果 Atlas 已有数据）
- ✅ `/api/health` 返回 mongo:true
- ✅ 5 秒内其他设备能拉到新数据

---

**部署遇到任何问题，把 Logs 标签的报错截图给我！**
