const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

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
    this.port = config.port;
    this.scheduler = scheduler;
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  setupMiddleware() {
    // 日志中间件
    this.app.use(logger);
    
    // CORS
    this.app.use(cors(this.config.cors));
    
    // JSON解析
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    
    // 限流中间件
    this.app.use('/api/', rateLimiter(this.config.rateLimit));
  }

  setupRoutes() {
    // 健康检查
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
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
    this.app.get('/api/scheduler/status', (req, res) => {
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
    
    // 全局错误处理
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
      console.log(`📚 接口文档: http://localhost:${this.port}/api`);
      console.log(`💚 健康检查: http://localhost:${this.port}/health`);
      console.log('========================================\n');
    });
  }

  getApp() {
    return this.app;
  }
}

module.exports = APIServer;