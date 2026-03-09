console.log('=' + '=='.repeat(60));
console.log('🧪 测试后端核心模块');
console.log('==' + '=='.repeat(60));

// 先加载环境变量
require('dotenv').config();

console.log('📋 检查环境变量...');
console.log(`   OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? '已设置' : '未设置'}`);

if (!process.env.OPENAI_API_KEY) {
  console.log('❌ OPENAI_API_KEY 未设置，测试受限');
  console.log('');
  console.log('💡 提示: 虽然AI摘要功能需要API Key，但其他模块仍可测试');
}

async function testModules() {
  console.log('');
  console.log('1️⃣ 测试数据库适配器...');
  try {
    const SQLiteAdapter = require('./config/sqliteAdapter');
    const db = new SQLiteAdapter('./data/news-test.db');
    const collection = db.collection('news');
    
    console.log('   ✅ 数据库适配器加载成功');
    
    // 测试插入
    console.log('   测试插入数据...');
    await collection.insertOne({
      title: '测试新闻',
      url: 'https://test.com/news/1',
      category: 'test',
      summary: '测试摘要',
      createdAt: new Date()
    });
    
    // 测试查询
    console.log('   测试查询数据...');
    const results = await collection.find({});
    console.log(`   ✅ 数据库测试通过: ${results.length} 条`);
    
    db.close();
  } catch (error) {
    console.error('   ❌ 数据库测试失败:', error.message);
    return false;
  }

  console.log('');
  console.log('2️⃣ 测试爬虫模块...');
  try {
    const ToutiaoScraper = require('./scraper/toutiaoScraper');
    const scraper = new ToutiaoScraper({
      categories: {
        tech: '科技'
      },
      requestInterval: 2000,
      timeout: 30000,
      baseUrl: 'https://www.toutiao.com'
    });
    console.log('   ✅ 爬虫模块加载成功（需要浏览器环境）');
  } catch (error) {
    console.error('   ❌ 爬虫模块加载失败:', error.message);
    return false;
  }

  console.log('');
  console.log('3️⃣ 测试数据处理器...');
  try {
    const DataProcessor = require('./processor/dataProcessor');
    console.log('   ✅ 数据处理器加载成功');
  } catch (error) {
    console.error('   ❌ 数据处理器加载失败:', error.message);
    return false;
  }

  console.log('');
  console.log('4️⃣ 测试AI摘要生成器...');
  if (process.env.OPENAI_API_KEY) {
    try {
      const AISummarizer = require('./summarizer/aiSummarizer');
      const summarizer = new AISummarizer({
        apiKey: process.env.OPENAI_API_KEY,
        model: 'glm-4-7-251222',
        maxTokens: 200,
        temperature: 0.7,
        batchSize: 5,
        requestInterval: 1000
      });
      console.log('   ✅ AI摘要生成器初始化成功');
    } catch (error) {
      console.error('   ❌ AI摘要生成器加载失败:', error.message);
      return false;
    }
  } else {
    console.log('   ⚠️  OPENAI_API_KEY 未设置，跳AI摘要生成器测试');
  }

  console.log('');
  console.log('5️⃣ 测试定时任务调度器...');
  try {
    const Scheduler = require('./scheduler');
    console.log('   ✅ 定时任务调度器加载成功');
  } catch (error) {
    console.error('   ❌ 定时任务调度器加载失败:', error.message);
    return false;
  }

  console.log('');
  console.log('=' + '=='.repeat(60));
  console.log('✅ 所有核心模块加载测试通过！');
  console.log('=' + '=='.repeat(60));
  console.log('');
  console.log('💡 下一步:');
  console.log('   1. 启动完整应用: node index.js');
  console.log('   2. 进入阶段3: API服务开发');
  console.log('   3. 进入阶段4: 前端开发');
  console.log('');
}

testModules().catch(error => {
  console.error('❌ 测试失败:', error);
  process.exit(1);
});
