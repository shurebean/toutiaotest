# 阶段6：部署与上线 - 实施步骤

**阶段时间**: 第24-26天
**预估工时**: 2-3天
**负责人**: 运维工程师

---

## 任务6.1：本地测试

**时间**: 第24天上午
**预估工时**: 2小时

### 实施步骤

#### 步骤6.1.1：启动所有服务

```bash
cd /home/toutiaotest

# 启动后端
echo "📦 启动后端服务..."
cd backend
node index-sqlite.js &
BACKEND_PID=$!
cd ..

# 等待后端启动
sleep 3

# 测试后端健康检查
echo "🧪 测试后端服务..."
curl -s http://localhost:5000/health | python3 -m json.tool

# 测试API接口
echo "🧪 测试API接口..."
curl -s http://localhost:5000/api/categories | python3 -m json.tool | head -20
curl -s http://localhost:5000/api/news | python3 -m json.tool | head -20
```

#### 步骤6.1.2：启动前端服务

```bash
cd /home/toutiaotest/frontend
npm run dev &
FRONTEND_PID=$!

# 等待前端启动
sleep 5

echo "📦 前端服务启动..."
echo "访问地址: http://localhost:3000"
```

#### 步骤6.1.3：功能联调测试

```bash
cat > /home/toutiaotest/test-integration.sh << 'EOF'
#!/bin/bash

echo "🧪 开始集成测试..."
echo "========================================"

# 测试1: 健康检查
echo "测试1: 健康检查"
HEALTH=$(curl -s http://localhost:5000/health)
if echo "$HEALTH" | grep -q '"status":"ok"'; then
  echo "✅ 健康检查通过"
else
  echo "❌ 健康检查失败"
  exit 1
fi

# 测试2: 板块列表
echo ""
echo "测试2: 板块列表"
CATEGORIES=$(curl -s http://localhost:5000/api/categories)
if echo "$CATEGORIES" | grep -q '"success":true'; then
  echo "✅ 板块列表获取成功"
else
  echo "❌ 板块列表获取失败"
  exit 1
fi

# 测试3: 新闻列表
echo ""
echo "测试3: 新闻列表"
NEWS=$(curl -s http://localhost:5000/api/news?category=tech)
if echo "$NEWS" | grep -q '"success":true'; then
  echo "✅ 新闻列表获取成功"
else
  echo "❌ 新闻列表获取失败"
  exit 1
fi

# 测试4: 搜索功能
echo ""
echo "测试4: 搜索功能"
SEARCH=$(curl -s "http://localhost:5000/api/search?q=科技")
if echo "$SEARCH" | grep -q '"success":true'; then
  echo "✅ 搜索功能正常"
else
  echo "❌ 搜索功能失败"
  exit 1
fi

echo ""
echo "========================================"
echo "✅ 所有集成测试通过！"
echo "========================================"
EOF

chmod +x /home/toutiaotest/test-integration.sh
/home/toutiaotest/test-integration.sh
```

### 验收标准
- ✅ 后端服务正常启动
- ✅ 前端服务正常启动
- ✅ 健康检查通过
- ✅ API接口正常
- ✅ 集成测试通过

---

## 任务6.2：Docker部署

**时间**: 第24天下午
**预估工时**: 3小时

### 实施步骤

#### 步骤6.2.1：创建生产环境配置

```bash
cat > /home/toutiaotest/.env.production << 'EOF'
# 生产环境配置
NODE_ENV=production

# OpenAI API配置（请替换为实际的API Key）
OPENAI_API_KEY=YOUR_ACTUAL_API_KEY_HERE

# 数据库配置
DATABASE_PATH=/app/data/news.db

# 抓取配置
SCRAPE_INTERVAL_HOURS=2
MAX_ARTICLES_PER_CATEGORY=20

# 服务端口
API_PORT=5000

# 日志配置
LOG_LEVEL=info
EOF
```

#### 步骤6.2.2：创建Docker Compose配置

```bash
cat > /home/toutiaotest/docker-compose.prod.yml << 'EOF'
version: '3.8'

services:
  backend:
    build: 
      context: ./backend
      dockerfile: Dockerfile.prod
    container_name: toutiao-backend
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    volumes:
      - ./data:/app/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
    container_name: toutiao-frontend
    ports:
      - "3000:3000"
    depends_on:
      - backend
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  data:
    driver: local

networks:
  default:
    name: toutiao-network
EOF
```

#### 步骤6.2.3：创建生产Dockerfile（后端）

```bash
cat > /home/toutiaotest/backend/Dockerfile.prod << 'EOF'
# 生产环境Dockerfile - 后端

FROM node:18-alpine AS builder

WORKDIR /app

# 复制依赖文件
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制源代码
COPY . .

# 运行时镜像
FROM node:18-alpine

WORKDIR /app

# 安装dumb-init
RUN apk add --no-cache dumb-init

# 创建非root用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S -u 1001 -G nodejs nodejs

# 复制依赖和源代码
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --chown=nodejs:nodejs /app/package*.json ./
COPY --chown=nodejs:nodejs /app/config ./config
COPY --chown=nodejs:nodejs /api ./api
COPY --chown=nodejs:nodejs /scraper ./scraper
COPY --chown=nodejs:nodejs /processor ./processor
COPY --chown=nodejs:nodejs /summarizer ./summarizer
COPY --chown=nodejs:nodejs /scheduler ./scheduler

# 创建数据目录
RUN mkdir -p /app/data && chown -R nodejs:nodejs /app/data

# 切换到非root用户
USER nodejs

# 暴露端口
EXPOSE 5000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

# 启动应用
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "index-sqlite.js"]
EOF
```

#### 步骤6.2.4：创建生产Dockerfile（前端）

```bash
cat > /home/toutiaotest/frontend/Dockerfile.prod << 'EOF'
# 生产环境Dockerfile - 前端

FROM node:18-alpine AS builder

WORKDIR /app

# 复制依赖文件
COPY package*.json ./

# 安装依赖
RUN npm ci

# 复制源代码
COPY . .

# 构建生产版本
RUN npm run build

# 运行时镜像
FROM node:18-alpine

WORKDIR /app

# 安装dumb-init和servehttp
RUN apk add --no-cache dumb-init && \
    npm install -g serve

# 创建非root用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S -u 1001 -G nodejs nodejs

# 复制构建产物
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist

# 切换到非root用户
USER nodejs

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000 || exit 1

# 启动应用
ENTRYPOINT ["dumb-init", "--"]
CMD ["serve", "-l", "3000", "-s", "dist"]
EOF
```

#### 步骤6.2.5：构建和测试Docker

```bash
cd /home/toutiaotest

# 构建镜像
echo "🐳 构建Docker镜像..."
docker-compose -f docker-compose.prod.yml build

# 启动服务
echo "🚀 启动Docker服务..."
docker-compose -f docker-compose.prod.yml up -d

# 检查容器状态
echo ""
echo "📊 容器状态..."
docker-compose -f docker-compose.prod.yml ps

# 等待服务启动
sleep 5

# 健康检查
echo ""
echo "🧪 健康检查..."
curl -s http://localhost:5000/health | python3 -m json.tool
```

### 验收标准
- ✅ Docker镜像构建成功
- ✅ 容器正常启动
- ✅ 健康检查通过
- ✅ 服务可访问

---

## 任务6.3：Nginx反向代理（可选）

**时间**: 第25天上午
**预估工时**: 2小时

### 实施步骤

#### 步骤6.3.1：创建Nginx配置

```bash
cat > /home/toutiaotest/nginx.conf << 'EOF'
# Nginx配置文件

upstream backend {
    server backend:5000;
    keepalive 64;
}

upstream frontend {
    server frontend:3000;
    keepalive 64;
}

# HTTP服务器 - 重定向到HTTPS
server {
    listen 80;
    server_name toutiao-news.example.com;
    
    return 301 https://$server_name$request_uri;
}

# HTTPS服务器
server {
    listen 443 ssl http2;
    server_name toutiao-news.example.com;
    
    # SSL证书配置
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # 日志
    access_log /var/log/nginx/toutiao-access.log;
    error_log /var/log/nginx/toutiao-error.log;
    
    # 前端静态文件
    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # 缓存配置
        proxy_cache_bypass $http_upgrade;
        proxy_cache_valid 200 1h;
    }
    
    # API接口
    location /api/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # 超时配置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # 健康检查
    location /health {
        proxy_pass http://backend/health;
        access_log off;
    }
    
    # Gzip压缩
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss application/rss+xml font/truetype font/opentype application/vnd.ms-fontobject image/svg+xml;
}
EOF
```

#### 步骤6.3.2：更新Docker Compose添加Nginx

```bash
cat > /home/toutiaotest/docker-compose.full.yml << 'EOF'
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    container_name: toutiao-backend
    environment:
      - NODE_ENV=production
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    volumes:
      - ./data:/app/data
    networks:
      - toutiao-network
    restart: unless-stopped

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
    container_name: toutiao-frontend
    depends_on:
      - backend
    networks:
      - toutiao-network
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    container_name: toutiao-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
      - nginx-logs:/var/log/nginx
    depends_on:
      - backend
      - frontend
    networks:
      - toutiao-network
    restart: unless-stopped

volumes:
  data:
    driver: local
  nginx-logs:
    driver: local

networks:
  toutiao-network:
    driver: bridge
EOF
```

### 验收标准
- ✅ Nginx配置正确
- ✅ SSL证书配置完成
- ✅ 反向代理正常工作

---

## 任务6.4：监控与日志

**时间**: 第26天上午
**预估工时**: 2小时

### 实施步骤

#### 步骤6.4.1：创建日志收集配置

```bash
cat > /home/toutiaotest/setup-logging.sh << 'EOF'
#!/bin/bash

echo "📝 配置日志收集..."

# 创建日志目录
mkdir -p logs/nginx
mkdir -p logs/backend
mkdir -p logs/frontend

# 配置日志轮转
cat > /etc/logrotate.d/toutiao-news << 'EOR'
/home/toutiaotest/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0644 root root
    sharedscripts
    postrotate
        docker-compose -f /home/toutiaotest/docker-compose.full.yml restart
    endscript
}
EOR

echo "✅ 日志收集配置完成"
EOF

chmod +x /home/toutiaotest/setup-logging.sh
/home/toutiaotest/setup-logging.sh
```

#### 步骤6.4.2：创建监控脚本

```bash
cat > /home/toutiaotest/monitor.sh << 'EOF'
#!/bin/bash

echo "📊 系统监控..."

# 检查服务状态
echo "========================================"
echo "服务状态"
echo "========================================"
docker-compose -f /home/toutiaotest/docker-compose.full.yml ps

# 检查容器健康
echo ""
echo "========================================"
echo "健康检查"
echo "========================================"

# 后端健康检查
BACKEND_HEALTH=$(curl -s http://localhost:5000/health)
if echo "$BACKEND_HEALTH" | grep -q '"status":"ok"'; then
  echo "✅ 后端服务健康"
else
  echo "❌ 后端服务异常"
  # 发送告警
  echo "🚨 告警: 后端服务异常" | mail -s "系统告警" admin@example.com
fi

# 前端健康检查
if curl -sf http://localhost:3000 > /dev/null; then
  echo "✅ 前端服务健康"
else
  echo "❌ 前端服务异常"
  # 发送告警
  echo "🚨 告警: 前端服务异常" | mail -s "系统告警" admin@example.com
fi

# 检查磁盘使用
echo ""
echo "========================================"
echo "磁盘使用"
echo "========================================"
df -h /home/toutiaotest/data

# 检查内存使用
echo ""
echo "========================================"
echo "内存使用"
echo "========================================"
free -h

# 检查API错误日志
echo ""
echo "========================================"
echo "最近错误日志"
echo "========================================"
tail -20 /home/toutiaotest/logs/backend/*.log 2>/dev/null | grep -i error

echo ""
echo "========================================"
echo "监控完成"
echo "========================================"
EOF

chmod +x /home/toutiaotest/monitor.sh
```

#### 步骤6.4.3：设置定时监控

```bash
# 添加到crontab
(crontab -l 2>/dev/null; echo "*/5 * * * * /home/toutiaotest/monitor.sh") | crontab -

echo "✅ 定时监控已配置（每5分钟执行一次）"
```

### 验收标准
- ✅ 日志收集配置完成
- ✅ 日志轮转配置完成
- ✅ 监控脚本创建
- ✅ 定时任务配置完成

---

## 任务6.5：文档完善

**时间**: 第26天下午
**预估工时**: 2小时

### 实施步骤

#### 步骤6.5.1：创建部署文档

```bash
cat > /home/toutiaotest/DEPLOYMENT.md << 'EOF'
# 今日头条热点抓取系统 - 部署文档

## 环境要求

### 硬件要求
- CPU: 2核心+
- 内存: 4GB+
- 磁盘: 20GB+

### 软件要求
- Docker: 20.10+
- Docker Compose: 2.0+
- Nginx: 1.18+ (可选）

## 部署步骤

### 1. 克隆项目

\`\`\`bash
git clone https://github.com/yourusername/toutiao-hotspots.git
cd toutiao-hotspots
\`\`\`

### 2. 配置环境变量

\`\`\`bash
# 复制环境变量模板
cp .env.example .env

# 编辑环境变量
nano .env
\`\`\`

必填项：
- OPENAI_API_KEY: OpenAI API密钥

### 3. Docker部署

\`\`\`bash
# 使用Docker Compose启动
docker-compose -f docker-compose.prod.yml up -d

# 查看日志
docker-compose -f docker-compose.prod.yml logs -f

# 查看服务状态
docker-compose -f docker-compose.prod.yml ps
\`\`\`

### 4. 验证部署

\`\`\`bash
# 健康检查
curl http://localhost:5000/health

# 测试API
curl http://localhost:5000/api/categories
curl http://localhost:5000/api/news
\`\`\`

### 5. 配置Nginx（可选）

\`\`\`bash
# 启动完整服务栈
docker-compose -f docker-compose.full.yml up -d
\`\`\`

## 访问地址

- 前端: http://localhost:3000
- 后端API: http://localhost:5000
- 完整服务（含Nginx）: https://toutiao-news.example.com

## 常用操作

### 查看日志

\`\`\`bash
# 查看所有服务日志
docker-compose -f docker-compose.prod.yml logs

# 查看特定服务日志
docker-compose -f docker-compose.prod.yml logs backend
docker-compose -f docker-compose.prod.yml logs frontend

# 实时查看日志
docker-compose -f docker-compose.prod.yml logs -f
\`\`\`

### 重启服务

\`\`\`bash
# 重启所有服务
docker-compose -f docker-compose.prod.yml restart

# 重启特定服务
docker-compose -f docker-compose.prod.yml restart backend
\`\`\`

### 停止服务

\`\`\`bash
# 停止所有服务
docker-compose -f docker-compose.prod.yml down

# 停止并删除数据卷
docker-compose -f docker-compose.prod.yml down -v
\`\`\`

### 更新服务

\`\`\`bash
# 拉取最新代码
git pull

# 重新构建镜像
docker-compose -f docker-compose.prod.yml build

# 重启服务
docker-compose -f docker-compose.prod.yml up -d
\`\`\`

## 监控

### 系统监控

\`\`\`bash
# 运行监控脚本
./monitor/health-check.sh
\`\`\`

### 日志查看

\`\`\`bash
# 查看错误日志
tail -f logs/backend/*.log | grep error

# 查看访问日志
tail -f logs/nginx/*.log
\`\`\`

## 故障排除

### 服务无法启动

1. 检查Docker是否正常运行
\`\`\`bash
docker ps
\`\`\`

2. 查看容器日志
\`\`\`bash
docker-compose logs
\`\`\`

3. 检查端口占用
\`\`\`bash
netstat -tulpn | grep -E '(5000|3000)'
\`\`\`

### API响应慢

1. 检查数据库性能
2. 查看系统资源使用
3. 检查网络连接

### 数据丢失

1. 检查数据卷是否正常挂载
2. 查看Docker卷状态
3. 恢复备份

## 备份与恢复

### 备份数据

\`\`\`bash
# 备份数据库
docker exec toutiao-backend tar -czf - /app/data | \
  cat > backup/data-$(date +%Y%m%d).tar.gz
\`\`\`

### 恢复数据

\`\`\`bash
# 恢复数据库
cat backup/data-YYYYMMDD.tar.gz | \
  docker exec -i toutiao-backend tar -xzf - -C /app
\`\`\`

## 安全建议

1. 定期更新Docker镜像
2. 使用强密码和SSL证书
3. 限制容器资源使用
4. 定期备份数据
5. 监控系统日志
EOF
```

### 验收标准
- ✅ 部署文档创建
- ✅ 操作说明清晰
- ✅ 故障排除指南完整

---

## 阶段6总结

### 完成检查清单
- [ ] 本地测试完成
- [ ] Docker部署完成
- [ ] Nginx配置完成
- [ ] 监控系统配置完成
- [ ] 文档完善完成

### 交付物
- ✅ Docker镜像
- ✅ Docker Compose配置
- ✅ Nginx配置
- ✅ 监控脚本
- ✅ 部署文档

### 部署状态
- 后端服务: ✅ 运行中
- 前端服务: ✅ 运行中
- Nginx代理: ✅ 运行中
- 监控系统: ✅ 已启用

### 下一步
进入**阶段7：上线与维护**

---

**文档版本**: v1.0
**创建日期**: 2026-03-02
