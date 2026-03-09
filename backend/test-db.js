const SQLiteAdapter = require('./config/sqliteAdapter');
const fs = require('fs');

async function testDatabase() {
  console.log('🧪 开始测试数据库...');
  
  // 创建数据目录
  const dataDir = './data';
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  const db = new SQLiteAdapter(dataDir + '/news.db');
  const collection = db.collection('news');
  
  // 插入测试数据
  console.log('📝 插入测试数据...');
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
      summary: '今日全球金融市场整体表现平稳。',
      keywords: ['金融', '市场', '经济'],
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]);
  
  // 查询数据
  console.log('🔍 查询数据...');
  const news = await collection.find({});
  console.log(`✅ 查询结果: ${news.length} 条`);
  
  // 按板块查询
  console.log('\n🔍 按板块查询...');
  const techNews = await collection.find({ category: 'tech' });
  console.log(`✅ 科技板块: ${techNews.length} 条`);
  
  const financeNews = await collection.find({ category: 'finance' });
  console.log(`✅ 财经板块: ${financeNews.length} 条`);
  
  db.close();
  console.log('\n✅ 数据库测试通过！');
}

testDatabase().catch(error => {
  console.error('❌ 数据库测试失败:', error);
  process.exit(1);
});
