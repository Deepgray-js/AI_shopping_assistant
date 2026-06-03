# AI导购系统 - Docker 容器化部署文档

## 项目概述

本项目是一套完整的 AI 导购系统（朝夕拾画），基于 Next.js 16 + Tailwind CSS + OpenAI Function Calling 实现。

## 环境要求

- Docker 20.10+
- Docker Compose 2.0+ (可选)
- Linux 服务器（推荐 Ubuntu 20.04+ / Debian 11+ / CentOS 8+）
- 至少 2GB 内存
- 至少 10GB 可用磁盘空间

## 快速开始

### 方法一：使用 Docker Compose（推荐）

1. **克隆仓库**
   ```bash
   git clone https://github.com/Deepgray-js/AI_shopping_assistant.git
   cd AI_shopping_assistant
   ```

2. **配置环境变量**
   ```bash
   cp .env.example .env
   # 编辑 .env 文件，填入你的阿里云 DashScope API Key
   nano .env
   ```

3. **启动容器**
   ```bash
   docker-compose up -d --build
   ```

4. **查看日志**
   ```bash
   docker-compose logs -f
   ```

5. **访问应用**
   打开浏览器访问：`http://your-server-ip:3000`

### 方法二：直接使用 Docker

1. **构建镜像**
   ```bash
   docker build -t ai-shopping-assistant:latest .
   ```

2. **运行容器**
   ```bash
   docker run -d \
     --name ai-shopping-assistant \
     --restart unless-stopped \
     -p 3000:3000 \
     -e DASHSCOPE_API_KEY=your_api_key_here \
     ai-shopping-assistant:latest
   ```

## 目录结构说明

```
AI_shopping_assistant/
├── src/                  # 源代码目录
│   ├── app/             # Next.js App Router 路由
│   ├── components/      # React 组件
│   └── lib/            # 工具库、数据、业务逻辑
├── public/             # 静态资源
├── docs/               # 文档
├── Dockerfile          # Docker 镜像构建文件
├── docker-compose.yml  # Docker Compose 配置
├── DEPLOYMENT.md       # 本文档
└── package.json        # 项目依赖
```

## 核心功能说明

1. **Function Calling 智能体工作流**
   - 自动识别查询意图（订单查询 / 商品推荐 / 低价替代）
   - 多轮对话记忆保持
   - 信息缺失时主动追问
2. **订单查询功能**
   - 状态筛选、时间范围、关键词搜索
3. **商品推荐**
   - 基于偏好和场景的精准推荐
4. **全流程演示页面**
   - `/project-flow-demo/index.html`

## 生产环境优化建议

### 1. 资源限制
```yaml
services:
  ai-shopping-assistant:
    # ...
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 2G
        reservations:
          cpus: '1.0'
          memory: 1G
```

### 2. 反向代理（使用 Nginx）
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 3. SSL 证书配置（使用 Let's Encrypt）
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## 常用命令

```bash
# 查看容器状态
docker-compose ps

# 查看应用日志
docker-compose logs -f

# 停止容器
docker-compose down

# 重启服务
docker-compose restart

# 更新并重新构建
git pull
docker-compose up -d --build
```

## 安全注意事项

1. 永远不要将包含真实 API Key 的 `.env` 文件提交到 Git（已在 `.gitignore` 中处理）
2. 建议使用强密码和 API Key 轮换策略
3. 限制服务器端口访问（使用防火墙只开放必要端口）
4. 定期更新 Docker 和 Node.js 版本以修复安全漏洞

## 故障排查

### 容器无法启动
```bash
# 查看详细错误信息
docker logs ai-shopping-assistant

# 检查环境变量配置
docker inspect ai-shopping-assistant | grep -A 5 Env
```

### 图片无法加载
- 确认 `public/data` 目录下所有资源文件已正确部署
- 检查文件权限和路径正确性

### API 调用失败
- 检查 `DASHSCOPE_API_KEY` 环境变量是否正确
- 检查网络连通性（特别是是否有防火墙限制）
- 查看阿里云 DashScope API 配额是否用尽

## 技术支持

项目 GitHub: [https://github.com/Deepgray-js/AI_shopping_assistant](https://github.com/Deepgray-js/AI_shopping_assistant)

## 许可证

本项目仅供学习和演示使用。
