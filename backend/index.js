require('dotenv').config();
const SQLiteAdapter = require('./config/sqliteAdapter');
const ToutiaoScraper = require('./scraper/toutiaoScraper');
const DataProcessor = require('./processor/dataProcessor');
const AISummarizer = require('./summarizer/aiSummarizer');
const Scheduler = require('./scheduler');

// 创建数据目录
const fs = require('fs');
const dataDir = './data';
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// 配置
const scraperConfig = {
  baseUrl: 'https://www.toutiao.com',
  categories: {
    hot: '热点推荐',
    finance: '财经',
    tech: '科技',
    entertainment: '娱乐',
    sports: '体育',
    world: '国际',
    military: '军事'
  },
  requestInterval: 2000,
  timeout: 30000
};

const openaiConfig = {
  apiKey: process.env.OPENAI_API_KEY,
  model: 'glm-4-7-251222',
  maxTokens: 200,
  temperature: 0.7,
  batchSize: 5,
  requestInterval: 1000
};

const schedulerConfig = {
  interval: process.env.SCRAPE_INTERVAL_HOURS || 2,
  cronPattern: '0 */2 * * *' // 每2小时执行一次
};

console.log('' + '='.repeat(60));
console.log('🚀 今日头条热点抓取系统启动');
console.log('=' + ''.repeat(60));
console.log('');
console.log('📦 配置信息:');
console.log(`   爬取间隔: ${schedulerConfig.interval} 小时`);
console.log(`   定时规则: ${schedulerConfig.cronPattern}`);
console.log(`   数据库: SQLite`);
console.log(`   API端口: ${process.env.API_PORT || 5000}`);
console.log('');

// 初始化数据库
console.log('📦 初始化数据库...');
const db = new SQLiteAdapter(dataDir + '/news.db');
const collection = db.collection('news');

// 检查是否已有数据
(async () => {
  try {
    const existingData = await collection.find({});
    console.log(`   数据库已有 ${existingData.length} 条数据`);
    
    if (existingData.length === 0) {
      console.log('   添加示例数据...');
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
      console.log('   ✅ 示例数据已添加');
    } else {
      console.log('   ✅ 数据库已有数据');
    }
  } catch (error) {
    console.error('   ❌ 添加示例数据失败:', error);
  }

  // 初始化各模块
  console.log('');
  console.log('🕷️ 初始化爬虫模块...');
  const scraper = new ToutiaoScraper(scraperConfig);
  await scraper.init();
  
  console.log('🔧 初始化数据处理器...');
  const processor = new DataProcessor(db);
  
  console.log('🤖 初始化AI摘要生成器...');
  const summarizer = new AISummarizer(openaiConfig);
  
  console.log('⏰ 初始化定时任务...');
  const scheduler = new Scheduler({
    scraper,
    processor,
    summarizer,
    config: schedulerConfig
  });
  
  await scheduler.start();
  
  console.log('');
  console.log('=' + ''.repeat(60));
  console.log('✅ 系统初始化完成！');
  console.log('=' + ''.repeat(60));
  console.log('');
  console.log('📋 访问地址:');
  console.log(`   前端: http://localhost:${process.env.FRONTEND_PORT || 3000}`);
  console.log(`   API: http://localhost:${process.env.API_PORT || 5000}`);
  console.log(`   健康检查: http://localhost:${process.env.API_PORT || 5000}/health`);
  console.log('');

  // 优雅退出
  process.on('SIGINT', async () => {
    console.log('');
    console.log('🛑 收到停止信号，正在关闭系统...');
    await scraper.close();
    scheduler.stop();
    db.close();
    console.log('✅ 系统已关闭');
    process.exit(0);
  });
  
  process.on('SIGTERM', async () => {
    console.log('');
    console.log('🛑 收到终止信号，正在关闭系统...');
    await scraper.close();
    scheduler.stop();
    db.close();
    console.log('✅ 系统已关闭');
    process.exit(0);
  });

})();

process.on('uncaughtException', (error) => {
  console.error('未捕获的异常:', error);
  process.exit(1);
});
