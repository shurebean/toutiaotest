const axios = require('axios');
const cheerio = require('cheerio');

async function scrapeToutiao() {
  console.log('🚀 开始抓取今日头条热点...\n');

  try {
    // 今日头条首页
    const url = 'https://www.toutiao.com';

    console.log('📡 请求今日头条首页...');
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 30000
    });

    console.log('✅ 页面获取成功，开始解析...\n');
    const $ = cheerio.load(response.data);

    const news = [];

    // 尝试多种选择器
    const selectors = [
      'a[href*="/article/"]',
      'a[href*="/i"]',
      'article a',
      '.feed-item a'
    ];

    const titles = new Set();
    const maxNews = 30;

    for (const selector of selectors) {
      $(selector).each((i, el) => {
        if (news.length >= maxNews) return false;

        const $el = $(el);
        const title = $el.text().trim();
        const href = $el.attr('href');

        // 过滤空标题或太短的标题
        if (title.length < 10 || title.length > 100) return;

        // 去重
        if (titles.has(title)) return;

        // 构造完整URL
        const fullUrl = href.startsWith('http') ? href : (href.startsWith('//') ? 'https:' + href : 'https://www.toutiao.com' + href);

        titles.add(title);
        news.push({
          id: news.length + 1,
          title: title,
          url: fullUrl,
          source: '今日头条',
          category: 'hot',
          createdAt: new Date().toISOString()
        });
      });

      if (news.length >= 5) break;
    }

    console.log('📊 抓取结果:');
    console.log(`   总计: ${news.length} 条新闻\n`);

    if (news.length > 0) {
      console.log('🔥 热点推荐:');
      news.slice(0, 10).forEach((item, i) => {
        console.log(`   ${i + 1}. ${item.title}`);
        console.log(`      链接: ${item.url}`);
        console.log('');
      });
    }

    return news;

  } catch (error) {
    console.error('❌ 抓取失败:', error.message);
    if (error.response) {
      console.error('   状态码:', error.response.status);
    }
    return [];
  }
}

async function saveToDatabase(news) {
  console.log('💾 保存到数据库...');

  const fs = require('fs');
  const path = require('path');

  const dataDir = './backend/data';
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const dbPath = path.join(dataDir, 'scraped-news.json');
  const timestamp = new Date().toISOString();

  let existing = [];
  if (fs.existsSync(dbPath)) {
    existing = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  }

  const newEntry = {
    timestamp: timestamp,
    news: news,
    count: news.length
  };

  // 保持最近 10 次抓取记录
  existing.unshift(newEntry);
  if (existing.length > 10) {
    existing = existing.slice(0, 10);
  }

  fs.writeFileSync(dbPath, JSON.stringify(existing, null, 2));
  console.log(`✅ 已保存到 ${dbPath}\n`);

  return newEntry;
}

async function main() {
  const news = await scrapeToutiao();

  if (news.length > 0) {
    const result = await saveToDatabase(news);
    console.log('========================================');
    console.log('✅ 抓取任务完成');
    console.log('========================================\n');
    return result;
  } else {
    console.log('⚠️  未能获取到任何新闻\n');
    return null;
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main().then((result) => {
    if (result) {
      console.log('抓取摘要:');
      console.log(`   时间: ${result.timestamp}`);
      console.log(`   数量: ${result.count} 条\n`);
    }
    process.exit(0);
  }).catch(err => {
    console.error('❌ 错误:', err);
    process.exit(1);
  });
}

module.exports = { scrapeToutiao, saveToDatabase, main };
