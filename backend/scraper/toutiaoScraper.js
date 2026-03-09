const puppeteer = require('puppeteer');

class ToutiaoScraper {
  constructor(config) {
    this.config = config;
    this.browser = null;
    this.categories = config.categories;
    this.userAgentList = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36'
    ];
  }

  async init() {
    try {
      console.log('🕷️ 初始化Puppeteer...');
      this.browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage'
        ]
      });
      console.log('✅ Puppeteer 浏览器启动成功');
    } catch (error) {
      console.error('❌ Puppeteer 启动失败:', error);
      throw error;
    }
  }

  getRandomUserAgent() {
    return this.userAgentList[
      Math.floor(Math.random() * this.userAgentList.length)
    ];
  }

  async scrapeCategory(categoryKey) {
    const page = await this.browser.newPage();
    const category = this.categories[categoryKey];
    
    try {
      console.log(`🔍 开始抓取 ${category} 板块...`);
      
      // 设置User-Agent
      await page.setUserAgent(this.getRandomUserAgent());
      
      // 访问页面
      const url = `${this.config.baseUrl}/${categoryKey}`;
      await page.goto(url, { 
        waitUntil: 'networkidle2',
        timeout: this.config.timeout 
      });
      
      // 等待页面加载
      await page.waitForTimeout(3000);
      
      // 提取新闻数据（需要根据实际页面结构调整选择器）
      const articles = await page.evaluate(() => {
        const cards = document.querySelectorAll('.article-card');
        return Array.from(cards).map(card => ({
          title: card.querySelector('.title')?.textContent.trim(),
          url: card.querySelector('a')?.href,
          source: card.querySelector('.source')?.textContent.trim(),
          time: card.querySelector('.time')?.textContent.trim(),
          commentCount: card.querySelector('.comment-count')?.textContent.trim(),
          image: card.querySelector('img')?.src
        }));
      });
      
      await page.close();
      console.log(`✅ ${category} 板块抓取完成: ${articles.length} 条`);
      return articles;
      
    } catch (error) {
      console.error(`❌ ${category} 板块抓取失败:`, error.message);
      await page.close().catch(() => {});
      return [];
    }
  }

  async scrapeAll() {
    const results = {};
    console.log('\n========================================');
    console.log('开始抓取所有板块...');
    console.log('========================================\n');
    
    for (const [key, name] of Object.entries(this.categories)) {
      results[key] = await this.scrapeCategory(key);
      
      // 请求间隔
      await this.sleep(this.config.requestInterval);
    }
    
    console.log('\n========================================');
    console.log('所有板块抓取完成！');
    console.log('========================================\n');
    
    return results;
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      console.log('✅ Puppeteer 浏览器已关闭');
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = ToutiaoScraper;
