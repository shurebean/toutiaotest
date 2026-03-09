const axios = require('axios');
const cheerio = require('cheerio');

// 尝试抓取今日头条热点
async function scrapeToutiaoHot() {
  console.log('📡 尝试今日头条热点...');

  try {
    const url = 'https://www.toutiao.com/hot-event/hot-board/?origin=toutiao_pc';

    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Referer': 'https://www.toutiao.com/'
      },
      timeout: 15000
    });

    const data = response.data;
    const news = [];
    const seen = new Set();

    if (data && data.data && data.data.list) {
      data.data.list.forEach((item, index) => {
        if (index >= 30) return;

        const title = item.Title || item.title;
        const url = item.ArticleUrl || item.url || item.Url || item.article_url;
        const hotValue = item.HotValue || item.hot_value || item.HotScore || item.hot_score;

        if (title && title.length > 2 && !seen.has(title)) {
          seen.add(title);

          news.push({
            id: index + 1,
            title: title,
            url: url || '#',
            source: '今日头条',
            category: 'hot',
            hotValue: hotValue || '',
            summary: hotValue ? `热度: ${hotValue}` : '',
            createdAt: new Date().toISOString()
          });
        }
      });
    }

    if (news.length > 0) {
      console.log(`✅ 今日头条热点成功: ${news.length} 条`);
      return news;
    }
    console.log('⚠️  今日头条热点未获取到数据');
    return null;

  } catch (error) {
    console.log(`⚠️  今日头条热点失败: ${error.message}`);
    return null;
  }
}

// 尝试抓取今日头条网页版
async function scrapeToutiaoWeb() {
  console.log('📡 尝试今日头条网页版...');

  try {
    const url = 'https://www.toutiao.com/ch/news_hot/';

    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Referer': 'https://www.toutiao.com/'
      },
      timeout: 15000
    });

    const $ = cheerio.load(response.data);
    const news = [];
    const seen = new Set();

    // 尝试多种选择器
    const selectors = [
      '.title-box a',
      '.title a',
      'a[href*="/article/"]',
      '.article-title'
    ];

    for (const selector of selectors) {
      $(selector).each((index, element) => {
        if (index >= 30) return false;

        const $link = $(element);
        const title = $link.text().trim();
        const href = $link.attr('href');

        if (title && title.length > 5 && !seen.has(title)) {
          seen.add(title);
          const fullUrl = href ? (href.startsWith('http') ? href : `https://www.toutiao.com${href}`) : '#';

          news.push({
            id: news.length + 1,
            title: title,
            url: fullUrl,
            source: '今日头条',
            category: 'hot',
            hotValue: '',
            summary: '',
            createdAt: new Date().toISOString()
          });
        }
      });

      if (news.length > 0) break;
    }

    if (news.length > 0) {
      console.log(`✅ 今日头条网页版成功: ${news.length} 条`);
      return news;
    }
    console.log('⚠️  今日头条网页版未获取到数据');
    return null;

  } catch (error) {
    console.log(`⚠️  今日头条网页版失败: ${error.message}`);
    return null;
  }
}

// 尝试抓取微博热搜
async function scrapeWeiboHot() {
  console.log('📡 尝试微博热搜...');

  try {
    const url = 'https://s.weibo.com/top/summary';

    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Referer': 'https://weibo.com'
      },
      timeout: 15000
    });

    const $ = cheerio.load(response.data);
    const news = [];
    const seen = new Set();

    $('#pl_top_realtimehot table tbody tr').each((index, element) => {
      if (index === 0) return true;
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

    if (news.length > 0) {
      console.log(`✅ 微博热搜成功: ${news.length} 条`);
      return news;
    }
    console.log('⚠️  微博热搜未获取到数据');
    return null;

  } catch (error) {
    console.log(`⚠️  微博热搜失败: ${error.message}`);
    return null;
  }
}

// 尝试抓取百度热搜
async function scrapeBaiduHot() {
  console.log('📡 尝试百度热搜...');

  try {
    const url = 'https://top.baidu.com/board?tab=realtime';

    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
      },
      timeout: 15000
    });

    const $ = cheerio.load(response.data);
    const news = [];
    const seen = new Set();

    $('.content_1YWBm').each((index, indexElement) => {
      if (index >= 30) return false;

      const $item = $(indexElement);
      const title = $item.find('.c-single-text-ellipsis').text().trim();
      const link = $item.find('a').attr('href');
      const hot = $item.find('.hot-index_1Bl1A').text().trim();

      if (title && title.length > 2 && !seen.has(title)) {
        seen.add(title);
        const fullUrl = link ? (link.startsWith('http') ? link : 'https://top.baidu.com' + link) : '#';

        news.push({
          id: index + 1,
          title: title,
          url: fullUrl,
          source: '百度热搜',
          category: 'hot',
          hotValue: hot,
          summary: hot ? `热度: ${hot}` : '',
          createdAt: new Date().toISOString()
        });
      }
    });

    if (news.length > 0) {
      console.log(`✅ 百度热搜成功: ${news.length} 条`);
      return news;
    }
    console.log('⚠️  百度热搜未获取到数据');
    return null;

  } catch (error) {
    console.log(`⚠️  百度热搜失败: ${error.message}`);
    return null;
  }
}

// 主抓取函数
async function scrapeToutiao() {
  console.log('🚀 开始抓取热点新闻...\n');

  // 优先尝试今日头条
  let news = await scrapeToutiaoHot();

  if (!news || news.length === 0) {
    news = await scrapeToutiaoWeb();
  }

  // 备选：微博
  if (!news || news.length === 0) {
    news = await scrapeWeiboHot();
  }

  if (news && news.length > 0) {
    console.log('\n📊 抓取结果:');
    console.log(`   总计: ${news.length} 条新闻\n`);

    console.log('🔥 热点排行榜 (前10条):');
    news.slice(0, 10).forEach((item, i) => {
      console.log(`   ${i + 1}. ${item.title}`);
      console.log(`      来源: ${item.source}`);
      if (item.hotValue) console.log(`      ${item.summary}`);
      console.log(`      链接: ${item.url}`);
      console.log('');
    });

    return news;
  }

  console.log('\n⚠️  所有来源均失败，返回空列表');
  return [];
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
    source: news[0]?.source || 'mixed',
    news: news,
    count: news.length
  };

  existing.unshift(newEntry);
  if (existing.length > 10) {
    existing = existing.slice(0, 10);
  }

  fs.writeFileSync(dbPath, JSON.stringify(existing, null, 2));
  console.log(`✅ 已保存到 ${dbPath}\n`);

  return newEntry;
}

// 保存新闻摘要到 /home/toutiaotest/news
async function saveNewsSummary(news, timestamp) {
  console.log('💾 保存新闻摘要到 /home/toutiaotest/news...');

  const fs = require('fs');
  const path = require('path');

  const newsDir = '/home/toutiaotest/news';
  if (!fs.existsSync(newsDir)) {
    fs.mkdirSync(newsDir, { recursive: true });
  }

  const date = new Date(timestamp);
  const dateStr = date.toISOString().split('T')[0];
  const timeStr = date.toISOString().split('T')[1].substring(0, 5).replace(':', '-');
  const summaryPath = path.join(newsDir, `toutiao-hot_${dateStr}_${timeStr}.md`);

  let content = `# 热点新闻摘要\n\n`;
  content += `**更新时间：** ${date.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}\n`;
  content += `**数据来源：** ${news[0]?.source || 'mixed'}\n`;
  content += `**新闻数量：** ${news.length}\n\n`;
  content += `---\n\n`;
  content += `## 热点排行榜\n\n`;

  news.forEach((item, i) => {
    content += `${i + 1}. ${item.title}\n`;
    if (item.hotValue) {
      content += `   - ${item.summary}\n`;
    }
    content += `   - 来源: ${item.source}\n`;
    content += `   - 链接: ${item.url}\n\n`;
  });

  fs.writeFileSync(summaryPath, content, 'utf8');
  console.log(`✅ 新闻摘要已保存到 ${summaryPath}\n`);

  return summaryPath;
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
  const news = await scrapeToutiao();

  if (news.length > 0) {
    const result = await saveToDatabase(news);
    // 保存新闻摘要到 /home/toutiaotest/news
    await saveNewsSummary(news, result.timestamp);
    console.log('========================================');
    console.log('✅ 抓取任务完成');
    console.log('========================================\n');
    return result;
  } else {
    console.log('⚠️  抓取失败，返回缓存数据...\n');
    return await getLatestNews();
  }
}

if (require.main === module) {
  main().then((result) => {
    if (result) {
      console.log('📋 抓取摘要:');
      console.log(`   时间: ${result.timestamp}`);
      console.log(`   来源: ${result.source}`);
      console.log(`   数量: ${result.count} 条\n`);
    }
    process.exit(0);
  }).catch(err => {
    console.error('❌ 错误:', err);
    process.exit(1);
  });
}

module.exports = { scrapeToutiao, saveToDatabase, getLatestNews, main };
