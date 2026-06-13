---
title: Heita Office
emoji: ⚫
colorFrom: yellow
colorTo: purple
sdk: docker
app_port: 7860
pinned: true
license: mit
short_description: 黑塔办事处 - 多设备数据同步版
---

# 黑塔办事处 (Heita Office)

> 永久免费的 Node.js + MongoDB Atlas 部署在 HuggingFace Spaces

## 🎯 特性

- ✅ 27 成员黑塔族谱 / 部队事件 / 导师信息 / 留言板
- ✅ 5 秒轮询多设备同步（可配置）
- ✅ MongoDB Atlas 持久化（即使 HF 容器重启也不丢数据）
- ✅ localStorage 兜底（即使 Atlas 不可用也能看历史数据）
- ✅ 管理员/超管/普通成员三级权限
- ✅ 角色名称登录 + 密码 abc123

## 🔐 环境变量配置

在 HuggingFace Spaces → Settings → Variables 添加：

| 名称 | 值 | 必填 |
|------|-----|------|
| `MONGODB_URI` | `mongodb+srv://heita-admin:HeitaOffice2026@cluster0.xc6yvnr.mongodb.net/?appName=Cluster0` | ✅ |
| `PORT` | `7860` (HF 默认) | ❌ |
| `DISABLE_MONGODB` | 留空 | ❌ |

## 🚀 部署步骤

1. 注册 HuggingFace 账号
2. 创建新 Space：sdk 选 `Docker`
3. 连接 GitHub 仓库：`lulutiya20-create/heita-office`
4. 配置环境变量（见上表）
5. 等待 3-5 分钟构建完成
6. 自动获得域名：`https://huggingface.co/spaces/你的用户名/heita-office`

## 💰 为什么选 HuggingFace？

- ✅ 完全免费，无信用卡
- ✅ CPU 2核 + 16GB 内存
- ✅ 无限流量
- ✅ 永久在线（无冷启动）
- ⚠️ 闲置几小时会停 → 用 UptimeRobot 保活

## 📦 数据存储

| 存储层 | 位置 | 寿命 |
|--------|------|------|
| localStorage | 浏览器 | 永久（不清缓存） |
| MongoDB Atlas | 云数据库 | 永久 |
| 文件系统 | HF 容器 | 容器重启会丢 |
