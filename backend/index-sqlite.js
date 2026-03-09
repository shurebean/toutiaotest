require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');

// 导入路由
const newsRoutes = require('./api/routes/news');
const categoriesRoutes = require('./api/routes/categories');
const searchRoutes = require('./api/routes/search');

// 导入中间件
const errorHandler = require('./api/middleware/errorHandler');
const logger = require('./api/middleware/logger');
const rateLimiter = require('./api/middleware/rateLimiter');

// 创建数据目录
const dataDir = './data';
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// 使用SQLite数据库
const SQLiteAdapter = require('./config/sqliteAdapter');
const db = new SQLiteAdapter(dataDir + '/news.db');

// 添加示例数据
(async () => {
  try {
    const collection = db.collection('news');
    
    // 检查是否已有数据
    const existingData = await collection.find({}).toArray();
    
    console.log(`当前数据库中有 ${existingData.length} 条数据`);
    
    if (existingData.length === 0) {
      console.log('📝 添加示例数据...');
      const sampleData = [
        {
          title: '2026年春季科技峰会即将召开',
          url: 'https://example.com/news/1',
          source: '科技日报',
          time: new Date(),
          commentCount: 1234,
          image: null,
          category: 'tech',
          scrapedAt: new Date(),
          summary: '2026年春季科技峰会将于下周在北京召开，预计将有来自全球的数千名科技专家了与，讨论人工智能、量子计算等前沿技术话题。',
          keywords: ['科技', '峰会', '人工智能'],
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          title: '全球金融市场今日动态分析',
          url: 'https://example.com/news/2',
          source: '财经周刊',
          time: new Date(Date.now() - 3600000),
          commentCount: 856,
          image: null,
          category: 'finance',
          scrapedAt: new Date(),
          summary: '今日全球金融市场整体表现平稳，主要股指小幅波动，投资者关注即将公布的经济数据。',
          keywords: ['金融', '市场', '经济'],
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          title: '热门电影本周票房突破10亿',
          url: 'https://example.com/news/3',
          source: '娱乐头条',
          time: new Date(Date.now() - 7200000),
          commentCount: 2341,
          image: null,
          category: 'entertainment',
          scrapedAt: new Date(),
          summary: '本周新上映的科幻大片深受观众喜爱，三天票房突破10亿元，成为年度最卖座电影之一。',
          keywords: ['电影', '票房', '娱乐'],
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          title: '重大体育赛事今日开幕',
          url: 'https://example.com/news/4',
          source: '体育快讯',
          time: new Date(Date.now() - 1800000),
          commentCount: 1567,
          image: null,
          category: 'sports',
          scrapedAt: new Date(),
          summary: '备受瞩目的国际体育赛事今日正式开幕，来自全球的运动员将在接下来的两周内展开激烈角逐。',
          keywords: ['体育', '赛事', '开幕'],
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          title: '国际航天领域再获突破',
          url: 'https://example.com/news/5',
          source: '环球时报',
          time: new Date(Date.now() - 5400000),
          commentCount: 987,
          image: null,
          category: 'world',
          scrapedAt: new Date(),
          summary: '国际航天领域今日传来重大突破消息，新型推进器系统测试成功，为未来深空探测奠定了基础。',
          keywords: ['航天', '科技', '国际'],
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      
      await collection.insertMany(sampleData);
      console.log('✅ 示例数据已添加');
    } else {
      console.log('✅ 数据库已有数据，跳过示例数据插入');
    }
  } catch (error) {
    console.error('添加示例数据失败:', error);
  }
})();

const app = express();
const PORT = process.env.API_PORT || 5000;

// 中间件
app.use(logger);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/', rateLimiter());

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: 'SQLite'
  });
});

// API路由
app.use('/api/news', newsRoutes(db));
app.use('/api/categories', categoriesRoutes());
app.use('/api/search', searchRoutes(db));

// 模拟抓取接口
app.post('/api/scrape', async (req, res) => {
  res.json({ 
    success: true, 
    message: '抓取功能需要在完整环境中运行（需要Puppeteer）' 
  });
});

// 调度器状态
app.get('/api/scheduler/status', (req, res) => {
  res.json({
    isRunning: false,
    message: '当前版本不支持定时任务'
  });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({ error: '接口不存在' });
});

// 错误处理
app.use(errorHandler);
app.use((err, req, res, next) => {
  console.error('未捕获的错误:', err);
  res.status(500).json({ 
    error: '服务器内部错误',
    message: err.message 
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log('========================================');
  console.log('🚀 API服务启动成功');
  console.log('💾 数据库: SQLite');
  console.log('📍 地址: http://localhost:' + PORT);
  console.log('💚 健康检查: http://localhost:' + PORT + '/health');
  console.log('📚 板块列表: http://localhost:' + PORT + '/api/categories');
  console.log('📰 新闻列表: http://localhost:' + PORT + '/api/news');
  console.log('🔍 搜索新闻: http://localhost:' + PORT + '/api/search?q=关键词');
  console.log('========================================\n');
});