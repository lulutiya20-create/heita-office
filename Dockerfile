FROM node:18-alpine

# HuggingFace Spaces 默认工作目录
WORKDIR /app

# 复制 package 文件并安装依赖（利用 Docker 缓存）
COPY package*.json ./
RUN npm install --omit=dev --no-audit --no-fund

# 复制源代码
COPY . .

# HuggingFace Spaces 默认暴露 7860 端口
EXPOSE 7860

# 启动命令
CMD ["node", "server.js"]
