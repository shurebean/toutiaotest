# 阶段6部署与上线 - 实施步骤

**阶段时间**: 第24-26天
**预估工时**: 2-3天
**负责人**: 运维工程师

---

## 任务6.1：本地测试

**时间**: 第24天上午
**预估工时**: 2小时

### 实实施步骤

#### 步骤6.1.1：启动后端服务

```bash
cd /home/toutiaotest/backend
node index-api.js
```

**服务地址**: http://localhost:5000

#### 步骤6.1.2：启动前端服务

```bash
cd /home/toutiaotest/frontend

# 先构建
npm run build

# 启动生产服务
npx serve -l 3000 -s dist
```

**服务地址**: http://localhost:3000

#### 步骤6.1.3：集成测试

```bash
# 执行集成测试脚本
./test-integration.sh
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

#### 步骤6.2.1：Docker配置

**已创建的配置文件**:
- ✅ `docker-compose.prod.yml` - 生产环境编排
- ✅的后端 `Dockerfile.prod` - 后端生产镜像
- ✅ `frontend/Dockerfile.prod` - 前端生产镜像

#### 步骤6.2.2：构建和启动Docker服务

```bash
cd /home/toutiaotest

# 构建镜像
docker-compose -f docker-compose.prod.yml build

# 启动服务
docker-compose -f docker-compose.prod.yml up -d

# 查看服务状态
docker-compose -f docker-compose.prod.yml ps

# 查看日志
docker-compose -f docker-compose.prod.yml logs
```

### 验收标准

- ✅ Docker镜像构建成功
- ✅ 容器正常启动
- ✅ 健康检查通过
- ✅ 服务端到端正常

---

## 任务6.3：服务管理

### 启动服务

```bash
cd /home/toutiaotest
./deploy.sh
```

### 停止服务

```bash
# 停止本地服务
pkill -f "node index-api.js"
pkill -f "serve"
```

### 查看日志

```bash
# 后端日志
tail -f /tmp/backend-deploy.log

# 前端日志
tail -f /tmp/frontend-deploy.log

# Docker日志
docker-compose -f docker-compose.prod.yml logs -f
```

---

## 任务6.4：部署验证

### 检查清单

- [ ] 后端服务启动
- [ ] 前端服务启动
- [ ] API接口测试
- [ ] 集成测试通过
- [ ] Docker容器运行

### 测试命令

```bash
# 健康检查
curl http://localhost:5000/health

# 板块列表
curl http://localhost:5000/api/categories

# 新闻列表
curl http://localhost:5000/api/news

# 搜索功能
curl "http://localhost:5000/api/search?q=科技"
```

---

## 部署脚本

### 快速部署脚本

```bash
# 使用部署脚本
cd /home/toutiaotest
./deploy.sh
```

该脚本会自动完成：
1. 停止现有服务
2. 构建前端
3. 启动后端服务
4. 启动前端服务
5. 运行集成测试

---

## 部署配置

### 环境变量

**配置文件**: `.env`

```env
NODE_ENV=production
OPENAI_API_KEY=your_api_key_here
SCRAPE_INTERVAL_HOURS=2
API_PORT=5000
```

### Docker Compose

**配置文件**: `docker-compose.prod.yml`

包含服务：
- ✅ backend (后端API)
- ✅ frontend (前端应用)

### 健康检查

**后端**: `GET http://localhost:5000/health`
**前端**: `GET http://localhost:3000`

---

## 部署流程

1. **本地测试** - 验证服务正常
2. **构建前端** - 生成生产构建
3. **启动服务** - 运行后端和前端
4. **集成测试** - 验证端到端功能
5. **监控服务** - 查看服务日志

---

**文档版本**: v1.0
**创建日期**: 2026-03-03
**最后更新**: 2026-03-03
