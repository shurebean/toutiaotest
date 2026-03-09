const ToutiaoScraper = require('./backend/scraper/toutiaoScraper');

async function main() {
  console.log('🚀 开始抓取今日头条热点...');

  const config = {
    baseUrl: 'https://www.toutiao.com',
    timeout: 30000,
    requestInterval: 2000,
    categories: {
      'news': '热点推荐',
      'finance': '财经',
      'tech': '科技',
      'entertainment': '娱乐',
      'sports': '体育',
      'world': '国际',
      'military': '军事'
    }
  };

  const scraper = new ToutiaoScraper(config);

  try {
    await scraper.init();
    const results = await scraper.scrapeAll();

    console.log('\n📊 抓取结果汇总:');
    let total = 0;
    for (const [key, name] of Object.entries(config.categories)) {
      const count = results[key]?.length || 0;
      console.log(`   ${name}: ${count} 条`);
      total += count;
    }
    console.log(`\n✅ 总计: ${total} 条新闻`);

    // 输出前几条作为示例
    if (results.news && results.news.length > 0) {
      console.log('\n🔥 热点推荐 (前3条):');
      results.news.slice(0, 3).forEach((item, i) => {
        console.log(`   ${i + 1}. ${item.title}`);
        console.log(`      来源: ${item.source}`);
        console.log(`      链接: ${item.url}`);
      });
    }

  } catch (error) {
    console.error('❌ 抓取失败:', error);
  } finally {
    await scraper.close();
  }
}

main().then(() => {
  console.log('\n✅ 抓取完成');
  process.exit(0);
}).catch(err => {
  console.error('❌ 错误:', err);
  process.exit(1);
});
