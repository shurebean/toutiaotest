# 阶段3：API服务开发 - 实施步骤

**阶段时间**: 第8-11天
**预估工时**: 3-4天
**负责人**: 后端开发

---

## 任务3.1：Express服务器搭建

**时间**: 第8天上午
**预估工时**: 2小时

### 实施步骤

#### 步骤3.1.1：创建中间件

**错误处理中间件**
```bash
cat > /home/toutiaotest/backend/api/middleware/errorHandler.js << 'EOF'
module.exports = (err, req, res, next) => {
  console.error('错误中间件捕获异常:', err);
  
  if (err.name === 'MongoError') {
    return res.status(500).json({
      success: false,
      error: '数据库错误',
      message: err.message
    });
  }
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: '数据验证失败',
      message: err.message
    });
  }
  
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: err.message || '服务器内部错误'
  });
};
EOF
```

**日志中间件**
```bash
cat > /home/toutiaotest/backend/api/middleware/logger.js << 'EOF'
module.exports = (req, res, next) => {
  const start = Date.now();
  
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`);
  });
  
  next();
};
EOF
```

**限流中间件**
```bash
cat > /home/toutiaotest/backend/api/middleware/rateLimiter.js << 'EOF'
const rateLimit = require('express-rate-limit');

module.exports = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000,
    max = 100,
    message = '请求过于频繁，请稍后再试'
  } = options;
  
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      error: message,
      retryAfter: windowMs / 1000
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        error: message,
        retryAfter: windowMs / 1000
      });
    }
  });
};
EOF
```

### 验收标准
- ✅ 所有中间件文件创建完成
- ✅ 中间件逻辑正确
- ✅ 错误处理完善

---

## 任务3.2：API路由开发

**时间**: 第8-9天
**预估工时**: 1.5天

### 实施步骤

#### 步骤3.2.1：创建新闻路由（Day 8）

```bash
cat > /home/toutiaotest/backend/api/routes/news.js << 'EOF'
const express = require('express');
const router = express.Router();

module.exports = (db) => {
  const collection = db.collection('news');
  
  // 获取新闻列表
  router.get('/', async (req, res) => {
    try {
      const { category, limit = 10, page = 1, withSummary = 'false' } = req.query;
      const limitNum = parseInt(limit);
      const pageNum = parseInt(page);
      const skipNum = (pageNum - 1) * limitNum;
      
      const query = category ? { category } : {};
      const news = await collection
        .find(query)
        .sort({ scrapedAt: -1 })
        .skip(skipNum)
        .limit(limitNum)
        .toArray();
      
      const total = await collection.countDocuments(query);
      
      const responseNews = withSummary === 'true' 
        ? news 
        : news.map(item => {
            const { summary, ...rest } = item;
            return rest;
          });
      
      res.json({
        success: true,
        data: responseNews,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      });
    } catch (error) {
      console.error('获取新闻列表失败:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });
  
  // 获取单条新闻
  router.get('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const news = await collection.findOne({ _id: id });
      
      if (!news) {
        return res.status(404).json({ 
          success: false,
          error: '新闻不存在' 
        });
      }
      
      res.json({ success: true, data: news });
    } catch (error) {
      console.error('获取新闻详情失败:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });
  
  // 获取最新新闻（所有板块）
  router.get('/latest/all', async (req, res) => {
    try {
      const { limit = 50 } = req.query;
      const news = await collection
        .find({})
        .sort({ scrapedAt: -1 })
        .limit(parseInt(limit))
        .toArray();
      
      const grouped = {};
      news.forEach(item => {
        if (!grouped[item.category]) {
          grouped[item.category] = [];
        }
        grouped[item.category].push(item);
      });
      
      res.json({ success: true, data: grouped, total: news.length });
    } catch (error) {
      console.error('获取最新新闻失败:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });
  
  return router;
};
EOF
```

#### 步骤3.2.2：创建板块路由（Day 8）

```bash
cat > /home/toutiaotest/backend/api/routes/categories.js << 'EOF'
const express = require('express');
const router = express.Router();

const categories = [
  { key: 'hot', name: '热点推荐' },
  { key: 'finance', name: '财经' },
  { key: 'tech', name: '科技' },
  { key: 'entertainment', name: '娱乐' },
  { key: 'sports', name: '体育' },
  { key: 'world', name: '国际' },
  { key: 'military', name: '军事' }
];

module.exports = () => {
  router.get('/', (req, res) => {
    res.json({ success: true, data: categories });
  });
  
  router.get('/:key', (req, res) => {
    const { key } = req.params;
    const category = categories.find(c => c.key === key);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        error: '板块不存在'
      });
    }
    
    res.json({ success: true, data: category });
  });
  
  return router;
};
EOF
```

#### 步骤3.2.3：创建搜索路由（Day 9）

```bash
cat > /home/toutiaotest/backend/api/routes/search.js << 'EOF'
const express = require('express');
const router = express.Router();

module.exports = (db) => {
  const collection = db.collection('news');
  
  // 搜索新闻
  router.get('/', async (req, res) => {
    try {
      const { q, category, limit = 20, page = 1 } = req.query;
      
      if (!q || q.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: '搜索关键词不能为空'
        });
      }
      
      const limitNum = parseInt(limit);
      const pageNum = parseInt(page);
      const skipNum = (pageNum - 1) * limitNum;
      
      // 获取所有新闻
      const allNews = await collection.find({}).toArray();
      
      // 简单的关键词搜索
      const results = allNews.filter(item => {
        // 板块过滤
        if (category && item.category !== category) {
          return false;
        }
        
        // 关键词匹配
        const searchText = `${item.title} ${item.summary || ''}`.toLowerCase();
        const keywords = q.toLowerCase().split(/\s+/);
        
        return keywords.some(keyword => searchText.includes(keyword));
      });
      
      const total = results.length;
      const pagedResults = results.slice(skipNum, skipNum + limitNum);
      
      res.json({
        success: true,
        data: pagedResults,
        query: q,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      });
    } catch (error) {
      console.error('搜索失败:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });
  
  // 获取搜索建议
  router.get('/suggestions', async (req, res) => {
    try {
      const results = await collection
        .find({})
        .sort({ commentCount: -1 })
        .limit(20)
        .toArray();
      
      const suggestions = results.map(r => r.title);
      
      res.json({ success: true, data: suggestions });
    } catch (error) {
      console.error('获取搜索建议失败:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });
  
  return router;
};
EOF
```

### 验收标准
- ✅ 新闻路由创建完成
- ✅ 板块路由创建完成
- ✅ 搜索路由创建完成
- ✅ 分页功能实现
- ✅ 参数验证实现

---

## 任务3.3：中间件完善

**时间**: 第10天
**预估工时**: 2小时

### 实施步骤

#### 步骤3.3.1：创建认证中间件（可选）

```bash
cat > /home/toutiaotest/backend/api/middleware/auth.js << 'EOF'
module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      error: '未提供认证信息'
    });
  }
  
  const token = authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({
      success: false,
      error: '无效的认证格式'
    });
  }
  
  // 这里可以添加 JWT 验证逻辑
  // 目前跳过验证
  req.user = { id: 'demo-user' };
  
  next();
};
EOF
```

#### 步骤3.3.2：创建缓存中间件（可选）

```bash
cat > /home/toutiaotest/backend/api/middleware/cache.js << 'EOF'
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5分钟

module.exports = (duration = CACHE_TTL) => {
  return (req, res, next) => {
    const key = req.originalUrl || req.url;
    const cached = cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < duration) {
      console.log(`✅ 缓存命中: ${key}`);
      return res.json(cached.data);
    }
    
    const originalJson = res.json.bind(res);
    res.json = (data) => {
      cache.set(key, {
        data,
        timestamp: Date.now()
      });
      return originalJson(data);
    };
    
    next();
  };
};
EOF
```

### 验收标准
- ✅ 认证中间件创建
- ✅ 缓存中间件创建
- ✅ 中间件逻辑正确

---

## 任务3.4：API服务器集成

**时间**: 第10-11天
**预估工时**: 1天

### 实施步骤

#### 步骤3.4.1：创建主服务器文件

```bash
cat > /home/toutiaotest/backend/api/server.js << 'EOF'
const express = require('express');
const cors = require('cors');

// 导入路由
const newsRoutes = require('./routes/news');
const categoriesRoutes = require('./routes/categories');
const searchRoutes = require('./routes/search');

// 导入中间件
const errorHandler = require('./middleware/errorHandler');
const logger = require('./middleware/logger');
const rateLimiter = require('./middleware/rateLimiter');

class APIServer {
  constructor(db, config, scheduler = null) {
    this.app = express();
    this.db = db;
    this.config = config;
    this.scheduler = scheduler;
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  setupMiddleware() {
    this.app.use(logger);
    this.app.use(cors(config.cors));
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use('/api/', rateLimiter(config.rateLimit));
  }

  setupRoutes() {
    // 健康检查
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: 'SQLite'
      });
    });
    
    // API路由
    this.app.use('/api/news', newsRoutes(this.db));
    this.app.use('/api/categories', categoriesRoutes());
    this.app.use('/api/search', searchRoutes(this.db));
    
    // 手动触发抓取
    this.app.post('/api/scrape', async (req, res) => {
      try {
        if (this.scheduler) {
          await this.scheduler.manualTrigger();
          res.json({ success: true, message: '抓取任务已触发' });
        } else {
          res.status(503).json({ error: '调度器未启动' });
        }
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    // 获取调度器状态
    this.app.get('/api/scheduler/status', (req,ress) => {
      if (this.scheduler) {
        res.json(this.scheduler.getStatus());
      } else {
        res.status(503).json({ error: '调度器未启动' });
      }
    });
    
    // 404处理
    this.app.use((req, res) => {
      res.status(404).json({ error: '接口不存在' });
    });
  }

  setupErrorHandling() {
    this.app.use(errorHandler);
    this.app.use((err, req, res, next) => {
      console.error('未捕获的错误:', err);
      res.status(500).json({ 
        error: '服务器内部错误',
        message: err.message 
      });
    });
  }

  start() {
    this.app.listen(this.port, () => {
      console.log('========================================');
      console.log('🚀 API服务启动成功');
      console.log(`📍 地址: http://localhost:${this.port}`);
      console.log(`💚 健康检查: http://localhost:${this.port}/health`);
      console.log(`📚 接口文档: http://localhost:${this.port}/api`);
      console.log('========================================\n');
    });
  }

  getApp() {
    return this.app;
  }
}

module.exports = APIServer;
EOF
```

#### 步骤3.4.2：创建应用入口文件

```bash
cat > /home/toutiaotest/backend/index.js << 'EOF'
require('dotenv').config();
const SQLiteAdapter = require('./config/sqliteAdapter');
const express = require('express');
const fs = require('fs');

// 创建数据目录
const dataDir = './data';
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// 初始化数据库
const db = new SQLiteAdapter(dataDir + '/news.db');

// 添加示例数据
(async () => {
  try {
    const collection = db.collection('news');
    const existingData = await collection.find({}).toArray();
    
    if (existingData.length === 0) {
      console.log('📝 添加示例数据...');
      await collection.insertMany([
        {
          title: '2026年春季科技峰会即将召开',
          url: 'https://example.com/news/1',
          source: '科技日报',
          time: new Date(),
          commentCount: 1234,
          image: null,
          category: 'tech',
          scrapedAt: new Date(),
          summary: '2026年春季科技峰会将于下周在北京召开。',
          keywords: ['科技', '峰会', '人工智能'],
          createdAt: new Date(),
          updatedAt: new Date()
        }
        // ... 更多示例数据
      ]);
      console.log('✅ 示例数据已添加');
    }
  } catch (error) {
    console.error('添加示例数据失败:', error);
  }
})();

// 导入模块
const APIServer = require('./api/server');

// 配置
const config = {
  port: process.env.API_PORT || 5000,
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
  },
  rateLimit: {
    windowMs: 15 * 60 * 1000,
    max: 100
  }
};

// 启动API服务
const apiServer = new APIServer(db, config);
apiServer.start();
EOF
```

#### 步骤3.4.3：测试API服务

```bash
cd /home/toutiaotest/backend
node index.js &

# 等待服务启动
sleep 3

# 测试健康检查
curl http://localhost:5000/health

# 测试板块列表
curl http://localhost:5000/api/categories

# 测试新闻列表
curl http://localhost:5000/api/news?category=tech
```

### 验收标准
- ✅ API服务器能正常启动
- ✅ 健康检查接口正常
- ✅ 所有API路由正常工作
- ✅ 中间件正常工作

---

## 阶段3总结

### 完成检查清单
- [ ] Express服务器搭建完成
- [ ] 所有API路由开发完成
- [ ] 中间件开发完成
- [ ] API集成测试通过

### 交付物
- ✅ `api/server.js` - API主服务器
- ✅ `api/routes/` - 所有路由文件
- ✅ `api/middleware/` - 所有中间件
- ✅ `index.js` - 应用入口

### API接口列表
- `GET /health` - 健康检查
- `GET /api/categories` - 获取板块列表
- `GET /api/news` - 获取新闻列表
- `GET /api/news/:id` - 获取单条新闻
- `GET /api/search` - 搜索新闻
- `POST /api/scrape` - 手动触发抓取
- `GET /api/scheduler/status` - 调度器状态

### 下一步
进入**阶段4：前端开发**

---

**文档版本**: v1.0
**创建日期**: 2026-03-02
