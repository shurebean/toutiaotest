require('dotenv').config();
const SQLiteAdapter = require('./config/sqliteAdapter');

// 导入模块
const APIServer = require('./api/server');

// 创建数据目录
const fs = require('fs');
const dataDir = './data';
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// 初始化数据库
console.log('📦 初始化数据库...');
const db = new SQLiteAdapter(dataDir + '/news.db');
const collection = db.collection('news');

// 添加示例数据
(async () => {
  try {
    const existingData = await collection.find({});
    console.log(`   数据库已有 ${existingData.length} 条数据`);
    
    if (existingData.length === 0) {
      console.log('📝 添加示例数据...');
      await collection.insertMany([
        {
          title: '2026年春季科技峰会即将召开',
          url: 'https://example.com/news/1',
          source: '科技日报',
          category: 'tech',
          summary: '2026年春季科技峰会将于下周在北京召开。',
          createdAt: new Date()
        },
        {
          title: '全球金融市场今日动态分析',
          url: 'https://example.com/news/2',
          source: '财经周刊',
          category: 'finance',
          summary: '今日全球金融市场整体表现平稳。',
          createdAt: new Date()
        }
      ]);
      console.log('✅ 示例数据已添加');
    }
  } catch (error) {
    console.error('❌ 添加示例数据失败:', error);
  }

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
  console.log('');
  console.log('🚀 启动API服务...');
  const apiServer = new APIServer(db, config);
  apiServer.start();
})();

process.on('uncaughtException', (error) => {
  console.error('未捕获的异常:', error);
  process.exit(1);
});
