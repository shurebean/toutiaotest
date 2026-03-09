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
      time: article.time || new Date(),
      category: category,
      summary: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
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
