const http = require('http');

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path
    };
    const start = Date.now();

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          duration: Date.now() - start
        });
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function runPerformanceTest() {
  console.log('========================================');
  console.log('⚡ 性能测试');
  console.log('========================================\n');

  // 测试1: 健康检查
  console.log('测试1: 健康检查 (100次)');
  const healthDurations = [];
  for (let i = 0; i < 100; i++) {
    const res = await makeRequest('/health');
    healthDurations.push(res.duration);
  }
  const healthAvg = healthDurations.reduce((a, b) => a + b, 0) / healthDurations.length;
  console.log(`  平均: ${healthAvg.toFixed(2)}ms`);
  console.log(`  状态: ${healthAvg < 100 ? '✅ 优秀' : healthAvg < 200 ? '⚠️ 良好' : '❌ 需优化'}\n`);

  // 测试2: 板块列表
  console.log('测试2: 板块列表 (100次)');
  const categoryDurations = [];
  for (let i = 0; i < 100; i++) {
    const res = await makeRequest('/api/categories');
    categoryDurations.push(res.duration);
  }
  const categoryAvg = categoryDurations.reduce((a, b) => a + b, 0) / categoryDurations.length;
  console.log(`  平均: ${categoryAvg.toFixed(2)}ms`);
  console.log(`  状态: ${categoryAvg < 200 ? '✅ 优秀' : categoryAvg < 500 ? '⚠️ 良好' : '❌ 需优化'}\n`);

  // 测试3: 新闻列表
  console.log('测试3: 新闻列表 (100次)');
  const newsDurations = [];
  for (let i = 0; i < 100; i++) {
    const res = await makeRequest('/api/news?limit=10');
    newsDurations.push(res.duration);
  }
  const newsAvg = newsDurations.reduce((a, b) => a + b, 0) / newsDurations.length;
  console.log(`  平均: ${newsAvg.toFixed(2)}ms`);
  console.log(`  状态: ${newsAvg < 500 ? '✅ 优秀' : newsAvg < 1000 ? '⚠️ 良好' : '❌ 需优化'}\n`);

  console.log('========================================');
  console.log('✅ 性能测试完成');
  console.log('========================================\n');

  console.log('性能摘要:');
  console.log(`  健康检查: ${healthAvg.toFixed(2)}ms`);
  console.log(`  板块列表: ${categoryAvg.toFixed(2)}ms`);
  console.log(`  新闻列表: ${newsAvg.toFixed(2)}ms\n`);

  const overallPass = healthAvg < 100 && categoryAvg < 200 && newsAvg < 500;
  if (overallPass) {
    console.log('✅ 所有性能测试通过！');
  } else {
    console.log('⚠️ 部分性能指标需要优化');
  }

  return {
    health: healthAvg,
    categories: categoryAvg,
    news: newsAvg,
    pass: overallPass
  };
}

runPerformanceTest().then(results => {
  process.exit(results.pass ? 0 : 1);
}).catch(error => {
  console.error('性能测试失败:', error);
  process.exit(1);
});
