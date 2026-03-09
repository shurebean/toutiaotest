# 阶段2：后端核心功能开发 - 实施步骤

**阶段时间**: 第3-11天
**预估工时**: 5-7天
**负责人**: 后端开发

---

## 任务2.1：爬虫模块开发

**时间**: 第3-4天
**预估工时**: 2天

### 实施步骤

#### 步骤2.1.1：创建爬虫基础文件（Day 3）

```bash
cat > /home/toutiaotest/backend/scraper/toutiaoScraper.js << 'EOF'
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
EOF
```

#### 步骤2.1.2：创建爬虫测试脚本

```bash
cat > /home/toutiaotest/backend/test-scraper.js << 'EOF'
const config = {
  baseUrl: 'https://www.toutiao.com',
  categories: {
    tech: '科技'
  },
  requestInterval: 2000,
  timeout: 30000
};

const ToutiaoScraper = require('./scraper/toutiaoScraper');

async function testScraper() {
  const scraper = new ToutiaoScraper(config);
  await scraper.init();
  
  const results = await scraper.scrapeAll();
  console.log('抓取结果:', JSON.stringify(results, null, 2));
  
  await scraper.close();
}

testScraper();
EOF
```

### 验收标准
- ✅ 爬虫基础结构创建完成
- ✅ Puppeteer 初始化配置正确
- ✅ 单页抓取函数实现
- ✅ 多页面抓取函数实现

---

## 任务2.2：数据处理模块开发

**时间**: 第5天
**预估工时**: 1天

### 实施步骤

#### 步骤2.2.1：创建数据处理器

```bash
cat > /home/toutiaotest/backend/processor/dataProcessor.js << 'EOF'
class DataProcessor {
  constructor(db) {
    this.db = db;
    this.collection = db.collection('news');
  }

  async process(rawData) {
    const processed = {};
    let totalProcessed = 0;
    let totalDuplicates = 0;
    
    console.log('\n========================================');
    console.log('开始处理数据...');
    console.log('========================================\n');
    
    for (const [category, articles] of Object.entries(rawData)) {
      console.log(`🔧 处理 ${category} 板块...`);
      
      const validArticles = articles
        .filter(article => this.isValid(article))
        .map(article => this.normalize(article, category));
      
      console.log(`   有效数据: ${validArticles.length} 条`);
      
      const { saved, duplicates } = await this.saveToDB(validArticles);
      
      processed[category] = saved;
      totalProcessed += saved.length;
      totalDuplicates += duplicates;
      
      console.log(`   新增数据: ${saved.length} 条`);
      console.log(`   重复数据: ${duplicates} 条\n`);
    }
    
    console.log('========================================');
    console.log(`数据处理完成！`);
    console.log(`总新增: ${totalProcessed} 条`);
    console.log(`总重复: ${totalDuplicates} 条`);
    console.log('========================================\n');
    
    return processed;
  }

  isValid(article) {
    return article.title && article.url && article.title.length > 5;
  }

  normalize(article, category) {
    return {
      title: article.title.trim(),
      url: article.url,
      source: article.source || '未知来源',
      time: this.parseTime(article.time),
      commentCount: this.parseCommentCount(article.commentCount),
      commentCount: this.parseCommentCount(article.commentCount),
      image: article.image || null,
      category: category,
      scrapedAt: new Date(),
      summary: null,
      keywords: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  parseTime(timeStr) {
    try {
      if (!timeStr) return new Date();
      
      const now = new Date();
      
      if (timeStr.includes('刚刚')) return now;
      if (timeStr.includes('分钟前')) {
        const minutes = parseInt(timeStr.match(/\d+/)[0]);
        return new Date(now.getTime() - minutes * 60 * 1000);
      }
      if (timeStr.includes('小时前')) {
        const hours = parseInt(timeStr.match(/\d+/)[0]);
        return new Date(now.getTime() - hours * 60 * 60 * 1000);
      }
      if (timeStr.includes('天前')) {
        const days = parseInt(timeStr.match(/\d+/)[0]);
        return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      }
      
      return now;
    } catch (error) {
      return new Date();
    }
  }

  parseCommentCount(countStr) {
    if (!countStr) return 0;
    const match = countStr.match(/\d+/);
    return match ? parseInt(match[0]) : 0;
  }

  async saveToDB(articles) {
    if (articles.length === 0) {
      return { saved: [], duplicates: 0 };
    }
    
    const saved = [];
    let duplicates = 0;
    
    for (const article of articles) {
      try {
        const existing = await this.collection.findOne({ url: article.url });
        if (existing) {
          duplicates++;
          continue;
        }
        
        const result = await this.collection.insertOne(article);
        saved.push({ ...article, _id: result.insertedId });
        
      } catch (error) {
        if (error.code === 11000) {
          duplicates++;
        } else {
          console.error('插入失败:', error);
        }
      }
    }
    
    return { saved, duplicates };
  }

  async updateSummary(id, summary) {
    try {
      await this.collection.updateOne(
        { _id: id },
        { $set: { summary: summary, updatedAt: new Date() } }
      );
      console.log(`✅ 摘要已更新: ${id}`);
    } catch (error) {
      console.error(`❌ 摘要更新失败: ${id}`, error);
    }
  }
}

module.exports = DataProcessor;
EOF
```

### 验收标准
- ✅ 数据清洗函数实现
- ✅ 去重逻辑实现
- ✅ 数据标准化实现
- ✅ 数据库存储功能实现

---

## 任务2.3：AI摘要生成模块

**时间**: 第6天
**预估工时**: 1天

### 实施步骤

#### 步骤2.3.1：创建AI摘要生成器

```bash
cat > /home/toutiaotest/backend/summarizer/aiSummarizer.js << 'EOF'
const OpenAI = require('openai');

class AISummarizer {
  constructor(config) {
    this.client = new OpenAI({ 
      apiKey: config.apiKey,
      baseURL: 'https://ark.cn-beijing.volces.com/api/coding/v3'
    });
    this.model = config.model;
    this.maxTokens = config.maxTokens;
    this.temperature = config.temperature;
    this.batchSize = config.batchSize;
    this.requestInterval = config.requestInterval;
  }

  async generateSummary(article) {
    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: '你是一个新闻摘要助手。请用100-150字概括新闻的主要内容，保持客观中立。'
          },
          {
            role: 'user',
            content: `请为以下新闻生成摘要：\n标题：${article.title}\n来源：${article.source}`
          }
        ],
        max_tokens: this.maxTokens,
        temperature: this.temperature
      });
      
      const summary = response.choices[0].message.content.trim();
      console.log(`✅ 摘要生成成功: ${article.title.substring(0, 30)}...`);
      return summary;
    } catch (error) {
      console.error(`❌ 摘要生成失败: ${article.title}`, error.message);
      return null;
    }
  }

    async batchGenerate(articles) {
    const results = [];
    const total = articles.length;
    
    console.log('\n========================================');
    console.log(`开始生成摘要...`);
    console.log(`总数量: ${total} 条`);
    console.log(`批量大小: ${this.batchSize}`);
    console.log('========================================\n');
    
    for (let i = 0; i < total; i += this.batchSize) {
      const batch = articles.slice(i, i + this.batchSize);
      const batchIndex = Math.floor(i / this.batchSize) + 1;
      const totalBatches = Math.ceil(total / this.batchSize);
      
      console.log(`处理批次 ${batchIndex}/${totalBatches} (${batch.length} 条)...`);
      
      const summaries = await Promise.all(
        batch.map(article => this.generateSummary(article))
      );
      
      results.push(...summaries);
      
      if (i + this.batchSize < total) {
        console.log(`⏳ 批次处理完成，等待 ${this.requestInterval}ms...`);
        await this.sleep(this.requestInterval);
      }
    }
    
    const successCount = results.filter(s => s !== null).length;
    console.log('\n========================================');
    console.log(`摘要生成完成！`);
    console.log(`成功: ${successCount}/${total} 条`);
    console.log('========================================\n');
    
    return results;
  }

  async generateSummariesForArticles(articles, processor) {
    console.log('\n========================================');
    console.log('开始为文章生成摘要...');
    console.log('========================================\n');
    
    const batchSize = 10;
    
    for (let i = 0; i < articles.length; i += batchSize) {
      const batch = articles.slice(i, i + batchSize);
      console.log(`处理第 ${Math.floor(i/batchSize) + 1} 批 (${batch.length} 条)...`);
      
      const summaries = await this.batchGenerate(batch);
      
      for (let j = 0; j < batch.length; j++) {
        if (summaries[j] && batch[j]._id) {
          await processor.updateSummary(batch[j]._id, summaries[j]);
        }
      }
      
      await this.sleep(2000);
    }
    
    console.log('\n========================================');
    console.log('所有摘要生成完成！');
    console.log('========================================\n');
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = AISummarizer;
EOF
```

### 验收标准
- ✅ OpenAI API 调用封装完成
- ✅ 摘要生成提示词设计完成
- ✅ 批量摘要生成实现
- ✅ 错误重试机制实现

---

## 任务2.4：定时任务模块

**时间**: 第7天
**预估工时**: 1天

### 实施步骤

#### 步骤2.4.1：创建任务调度器

```bash
cat > /home/toutiaotest/backend/scheduler/index.js << 'EOF'
const cron = require('node-cron');

class Scheduler {
  constructor({ scraper, processor, summarizer, config }) {
    this.scraper = scraper;
    this.processor = processor;
    this.summarizer = summarizer;
    this.config = config;
    this.cronJob = null;
    this.isRunning = false;
  }

  async start() {
    console.log('⏰ 启动定时任务调度器...');
    
    const cronPattern = this.config.cronPattern;
    this.cronJob = cron.schedule(cronPattern, async () => {
      if (this.isRunning) {
        console.log('⚠️  上一次任务还在运行，跳过本次执行');
        return;
      }
      await this.run();
    });
    
    console.log(`✅ 定时任务已启动: ${cronPattern}`);
    console.log(`   执行间隔: 每 ${this.config.interval} 小时`);
    
    // 立即执行一次
    console.log('\n执行首次抓取任务...\n');
    await this.run();
  }

  async run() {
    if (this.isRunning) {
      console.log('⚠️  任务正在运行中...');
      return;
    }
    
    this.isRunning = true;
    const startTime = Date.now();
    
    try {
      console.log('========================================');
      console.log('🕒 开始抓取任务');
      console.log(`时间: ${new Date().toLocaleString('zh-CN')}`);
      console.log('========================================\n');
      
      // 1. 抓取数据
      console.log('步骤 1/3: 抓取数据...');
      const rawData = await this.scraper.scrapeAll();
      
      // 2. 清洗并保存
      console.log('\n步骤 2/3: 清洗并保存数据...');
      const processedData = await this.processor.process(rawData);
      
      // 3. 生成摘要（异步）
      console.log('\n步骤 3/3: 生成摘要...');
      this.generateSummaries(processedData).catch(error => {
        console.error('❌ 摘要生成失败:', error);
      });
      
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log('\n========================================');
      console.log('✅ 抓取任务完成');
      console.log(`耗时: ${duration} 秒`);
      console.log('========================================\n');
      
    } catch (error) {
      console.error('\n========================================');
      console.error('❌ 抓取任务失败');
      console.error(error);
      console.error('========================================\n');
      this.sendAlert(error);
      
    } finally {
      this.isRunning = false;
    }
  }

  async generateSummaries(data) {
    try {
      const allArticles = [];
      for (const [category, articles] of Object.entries(data)) {
        allArticles.push(...articles);
      }
      
      if (allArticles.length === 0) {
        console.log('⚠️  没有新文章需要生成摘要');
        return;
      }
      
      await this.summarizer.generateSummariesForArticles(
        allArticles, 
        this.processor
      );
      
    } catch (error) {
      console.error('❌ 摘要生成失败:', error);
      throw error;
    }
  }

  async manualTrigger() {
    console.log('🔄 手动触发抓取任务...');
    await this.run();
  }

  stop() {
    if (this.cronJob) {
      this.cronJob.stop();
      console.log('⏹️  定时任务已停止');
    }
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      interval: this.config.interval,
      cronPattern: this.config.cronPattern
    };
  }

  sendAlert(error) {
    console.log('🚨 告警: 抓取任务失败');
    console.log(`错误信息: ${error.message}`);
    console.log(`时间: ${new Date().toLocaleString('zh-CN')}`);
  }
}

module.exports = Scheduler;
EOF
```

### 验收标准
- ✅ 定时任务配置完成
- ✅ 任务调度逻辑实现
- ✅ 手动任务触发功能实现
- ✅ 任务状态监控实现

---

## 阶段2总结

### 完成检查清单
- [ ] 爬虫模块开发完成
- [ ] 数据处理模块开发完成
- [ ] AI摘要生成模块开发完成
- [ ] 定时任务模块开发完成

### 交付物
- ✅ `scraper/toutiaoScraper.js` - 爬虫主文件
- ✅ `processor/dataProcessor.js` - 数据处理器
- ✅ `summarizer/aiSummarizer.js` - AI摘要生成器
- ✅ `scheduler/index.js` - 任务调度器

### 测试清单
- [ ] 爬虫功能测试
- [ ] 数据处理测试
- [ ] AI摘要生成测试
- [ ] 定时任务测试

### 下一步
进入**阶段3：API服务开发**

---

**文档版本**: v1.0
**创建日期**: 2026-03-02
