const http = require('http');

// 简单的HTTP请求函数
function makeRequest(path, method = 'GET') {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            body: JSON.parse(data)
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            body: data
          });
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function runTests() {
  console.log('========================================');
  console.log('🧪 开始API集成测试');
  console.log('========================================\n');

  let passed = 0;
  let failed = 0;
  const results = [];

  // 测试1: 健康检查
  console.log('测试1: 健康检查');
  try {
    const res = await makeRequest('/health');
    if (res.status === 200 && res.body.status === 'ok') {
      console.log('  ✅ 通过');
      passed++;
      results.push({ test: '健康检查', status: 'PASS' });
    } else {
      console.log('  ❌ 失败');
      failed++;
      results.push({ test: '健康检查', status: 'FAIL', error: res.body });
    }
  } catch (error) {
    console.log('  ❌ 失败:', error.message);
    failed++;
    results.push({ test: '健康检查', status: 'FAIL', error: error.message });
  }

  // 测试2: 板块列表
  console.log('\n测试2: 获取板块列表');
  try {
    const res = await makeRequest('/api/categories');
    if (res.status === 200 && res.body.success && Array.isArray(res.body.data) && res.body.data.length > 0) {
      console.log('  ✅ 通过 - ' + res.body.data.length + ' 个板块');
      passed++;
      results.push({ test: '板块列表', status: 'PASS', count: res.body.data.length });
    } else {
      console.log('  ❌ 失败');
      failed++;
      results.push({ test: '板块列表', status: 'FAIL', error: res.body });
    }
  } catch (error) {
    console.log('  ❌ 失败:', error.message);
    failed++;
    results.push({ test: '板块列表', status: 'FAIL', error: error.message });
  }

  // 测试3: 新闻列表
  console.log('\n测试3: 获取新闻列表');
  try {
    const res = await makeRequest('/api/news?limit=10');
    if (res.status === 200 && res.body.success && Array.isArray(res.body.data)) {
      console.log('  ✅ 通过 - ' + res.body.data.length + ' 条新闻');
      passed++;
      results.push({ test: '新闻列表', status: 'PASS', count: res.body.data.length });
    } else {
      console.log('  ❌ 失败');
      failed++;
      results.push({ test: '新闻列表', status: 'FAIL', error: res.body });
    }
  } catch (error) {
    console.log('  ❌ 失败:', error.message);
    failed++;
    results.push({ test: '新闻列表', status: 'FAIL', error: error.message });
  }

  // 测试4: 板块筛选
  console.log('\n测试4: 按板块筛选（科技）');
  try {
    const res = await makeRequest('/api/news?category=tech');
    if (res.status === 200 && res.body.success) {
      console.log('  ✅ 通过 - ' + res.body.data.length + ' 条科技新闻');
      passed++;
      results.push({ test: '板块筛选', status: 'PASS', count: res.body.data.length });
    } else {
      console.log('  ❌ 失败');
      failed++;
      results.push({ test: '板块筛选', status: 'FAIL', error: res.body });
    }
  } catch (error) {
    console.log('  ❌ 失败:', error.message);
    failed++;
    results.push({ test: '板块筛选', status: 'FAIL', error: error.message });
  }

  // 测试5: 搜索功能
  console.log('\n测试5: 搜索功能');
  try {
    const res = await makeRequest('/api/search?q=%E7%A7%91%E6%99%AF');
    if (res.status === 200 && res.body.success) {
      console.log('  ✅ 通过 - 找到 ' + res.body.data.length + ' 条结果');
      passed++;
      results.push({ test: '搜索功能', status: 'PASS', count: res.body.data.length });
    } else {
      console.log('  ❌ 失败');
      failed++;
      results.push({ test: '搜索功能', status: 'FAIL', error: res.body });
    }
  } catch (error) {
    console.log('  ❌ 失败:', error.message);
    failed++;
    results.push({ test: '搜索功能', status: 'FAIL', error: error.message });
  }

  // 测试6: 分页功能
  console.log('\n测试6: 分页功能');
  try {
    const res = await makeRequest('/api/news?page=1&limit=5');
    if (res.status === 200 && res.body.pagination && res.body.pagination.page === 1 && res.body.pagination.limit === 5) {
      console.log('  ✅ 通过');
      passed++;
      results.push({ test: '分页功能', status: 'PASS' });
    } else {
      console.log('  ❌ 失败');
      failed++;
      results.push({ test: '分页功能', status: 'FAIL', error: res.body });
    }
  } catch (error) {
    console.log('  ❌ 失败:', error.message);
    failed++;
    results.push({ test: '分页功能', status: 'FAIL', error: error.message });
  }

  // 测试7: 错误处理（空搜索）
  console.log('\n测试7: 错误处理（空搜索关键词）');
  try {
    const res = await makeRequest('/api/search?q=');
    if (res.status === 400) {
      console.log('  ✅ 通过');
      passed++;
      results.push({ test: '错误处理', status: 'PASS' });
    } else {
      console.log('  ❌ 失败');
      failed++;
      results.push({ test: '错误处理', status: 'FAIL', error: res.body });
    }
  } catch (error) {
    console.log('  ❌ 失败:', error.message);
    failed++;
    results.push({ test: '错误处理', status: 'FAIL', error: error.message });
  }

  // 测试总结
  console.log('\n========================================');
  console.log('📊 测试总结');
  console.log('========================================');
  console.log(`总数: ${passed + failed}`);
  console.log(`通过: ${passed} ✅`);
  console.log(`失败: ${failed} ❌`);
  console.log(`通过率: ${((passed / (passed + failed)) * 100).toFixed(2)}%\n`);

  if (failed === 0) {
    console.log('✅ 所有测试通过！');
  } else {
    console.log('⚠️  存在失败的测试');
    results.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`  - ${r.test}: ${r.error || '未知错误'}`);
    });
  }

  console.log('\n详细结果:');
  results.forEach(r => {
    const icon = r.status === 'PASS' ? '✅' : '❌';
    const detail = r.count ? `(${r.count})` : '';
    console.log(`  ${icon} ${r.test} ${detail}`);
  });

  return { passed, failed, results };
}

// 运行测试
runTests().then(({ passed, failed, results }) => {
  process.exit(failed > 0 ? 1 : 0);
}).catch(error => {
  console.error('测试执行失败:', error);
  process.exit(1);
});
