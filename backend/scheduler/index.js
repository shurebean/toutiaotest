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
      
      // 3. 生成摘要（异步，不阻塞）
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
