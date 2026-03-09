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
      console.log(`   正在生成摘要: ${article.title.substring(0, 30)}...`);
      
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: '你是一个新闻摘要助手。请用100-150字概括新闻的主要内容，保持客观中立，重点突出核心信息。'
          },
          {
            role: 'user',
            content: `请为以下新闻生成摘要：

标题：${article.title}
来源：${article.source}

请生成简洁、准确的摘要。`
          }
        ],
        max_tokens: this.maxTokens,
        temperature: this.temperature
      });
      
      const summary = response.choices[0].message.content.trim();
      console.log(`   ✅ 摘要生成成功: ${summary.substring(0, 50)}...`);
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
    console.log('开始生成摘要...');
    console.log(`总数量: ${total} 条`);
    console.log(`批量大小: ${this.batchSize}`);
    console.log('========================================\n');
    
    for (let i = 0; i < total; i += this.batchSize) {
      const batch = articles.slice(i, i + this.batchSize);
      const batchIndex = Math.floor(i / (this.batchSize)) + 1;
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
    console.log('摘要生成完成！');
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
      
      // 更新数据库
      for (let j = 0; j < batch.length; j++) {
        if (summaries[j] && batch[j]._id) {
          await processor.updateSummary(batch[j]._id.toString(), summaries[j]);
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
