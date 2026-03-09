const axios = require('axios');
const cheerio = require('cheerio');

async function scrapeWeiboHot() {
  console.log('🚀 开始抓取微博热搜...\n');

  try {
    const url = 'https://s.weibo.com/top/summary';

    console.log('📡 请求微博热搜...');
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Referer': 'https://weibo.com'
      },
      timeout: 30000
    });

    console.log('✅ 页面获取成功，开始解析...\n');
    const $ = cheerio.load(response.data);

    const news = [];
    const seen = new Set();

    // 微博热搜选择器
    $('#pl_top_realtimehot table tbody tr').each((index, element) => {
      if (index === 0) return true; // 跳过表头
      if (news.length >= 30) return false;

      const $item = $(element);
      const rank = $item.find('td').eq(0).text().trim();
      const $link = $item.find('td').eq(1).find('a');
      const title = $link.text().trim();
      const href = $link.attr('href');
      const hot = $item.find('td').eq(1).find('span').text().trim();

      if (title && title.length > 2 && !seen.has(title)) {
        seen.add(title);
        const fullUrl = href ? (href.startsWith('http') ? href : `https://s.weibo.com${href}`) : '#';

        news.push({
          id: rank || (news.length + 1),
          title: title,
          url: fullUrl,
          source: '微博热搜',
          category: 'hot',
          hotValue: hot,
          summary: hot ? `热度: ${hot}` : '',
          createdAt: new Date().toISOString()
        });
      }
    });

    // 如果没有抓取到数据，尝试备用选择器
    if (news.length === 0) {
      console.log('⚠️  主选择器未获取数据，尝试备用选择器...\n');

      $('.list li').each((index, element) => {
        if (news.length >= 30) return false;

        const $item = $(element);
        const rank = $item.find('.num').text().trim();
        const title = $item.find('a').text().trim();
        const href = $item.find('a').attr('href');
        const hot = $item.find('.hot').text().trim();

        if (title && title.length > 2 && !seen.has(title)) {
          seen.add(title);
          const fullUrl = href ? (href.startsWith('http') ? href : `https://s.weibo.com${href}`) : '#';

          news.push({
            id: rank || (news.length + 1),
            title: title,
            url: fullUrl,
            source: '微博热搜',
            category: 'hot',
            hotValue: hot,
            summary: hot ? `热度: ${hot}` : '',
            createdAt: new Date().toISOString()
          });
        }
      });
    }

    console.log('📊 抓取结果:');
    console.log(`   总计: ${news.length} 条新闻\n`);

    if (news.length > 0) {
      console.log('🔥 微博热搜排行榜:');
      news.slice(0, 15).forEach((item, i) => {
        console.log(`   ${i + 1}. ${item.title}`);
        if (item.hotValue) console.log(`      ${item.summary}`);
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

  const dbPath = path.join(dataDir, 'toutiao-news.json');
  const timestamp = new Date().toISOString();

  let existing = [];
  if (fs.existsSync(dbPath)) {
    existing = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  }

  const newEntry = {
    timestamp: timestamp,
    source: 'weibo',
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

async function getLatestNews() {
  const fs = require('fs');
  const path = require('path');
  const dbPath = path.join('./backend/data', 'toutiao-news.json');

  if (!fs.existsSync(dbPath)) {
    return null;
  }

  const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  return data[0] || null;
}

async function main() {
  const news = await scrapeWeiboHot();

  if (news.length > 0) {
    const result = await saveToDatabase(news);
    console.log('========================================');
    console.log('✅ 抓取任务完成');
    console.log('========================================\n');
    return result;
  } else {
    console.log('⚠️  未能获取到任何新闻，返回缓存数据...\n');
    return await getLatestNews();
  }
}

if (require.main === module) {
  main().then((result) => {
    if (result) {
      console.log('📋 抓取摘要:');
      console.log(`   时间: ${result.timestamp}`);
      console.log(`   数量: ${result.count} 条\n`);
    }
    process.exit(0);
  }).catch(err => {
    console.error('❌ 错误:', err);
    process.exit(1);
  });
}

module.exports = { scrapeWeiboHot, saveToDatabase, getLatestNews, main };
