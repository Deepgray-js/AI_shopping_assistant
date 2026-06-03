# 第一阶段：构建
FROM node:20-slim AS builder

WORKDIR /app

# 复制 package 相关文件
COPY package*.json ./

# 安装所有依赖（包括 devDependencies 用于构建）
RUN npm ci

# 复制源代码
COPY . .

# 构建项目
RUN npm run build

# 第二阶段：生产环境
FROM node:20-slim AS runner

WORKDIR /app

# 复制 package 相关文件
COPY package*.json ./

# 只安装生产依赖
RUN npm ci --only=production

# 从构建阶段复制构建产物
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.* ./

# 设置权限
RUN chown -R node:node /app
USER node

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s \
  CMD curl -f http://localhost:3000/ || exit 1

# 启动命令
CMD ["npm", "start"]
