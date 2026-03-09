  async insertMany(docs) {
    const results = [];
    let successCount = 0;
    let duplicateCount = 0;
    
    for (const doc of docs) {
      try {
        const result = await this.insertOne(doc);
        results.push(result.insertedId);
        successCount++;
      } catch (error) {
        if (error.code === 11000) {
          duplicateCount++;
          console.log(`⚠️  跳过重复: ${doc.title.substring(0, 30)}...`);
        } else {
          console.error('插入失败:', error);
          throw error;
        }
      }
    }
    
    console.log(`📊 批量插入: 成功 ${successCount}, 跳过 ${duplicateCount}`);
    return { insertedIds: results };
  }