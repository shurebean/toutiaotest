const express = require('express');
const router = express.Router();

module.exports = (db) => {
  const collection = db.collection('news');
  
  // 搜索新闻
  router.get('/', async (req, res) => {
    try {
      const { 
        q, 
        category, 
        limit = 20,
        page = 1
      } = req.query;
      
      if (!q || q.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: '搜索关键词不能为空'
        });
      }
      
      const limitNum = parseInt(limit);
      const pageNum = parseInt(page);
      const skipNum = (pageNum - 1) * limitNum;
      
      // 获取所有新闻
      const allNews = await collection.find({});
      
      // 简单的关键词搜索
      const results = allNews.filter(item => {
        // 板块过滤
        if (category && item.category !== category) {
          return false;
        }
        
        // 关键词匹配
        const searchText = `${item.title} ${item.summary || ''}`.toLowerCase();
        const keywords = q.toLowerCase().split(/\s+/);
        
        return keywords.some(keyword => searchText.includes(keyword));
      });
      
      const total = results.length;
      const pagedResults = results.slice(skipNum, skipNum + limitNum);
      
      res.json({
        success: true,
        data: pagedResults,
        query: q,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      });
      
    } catch (error) {
      console.error('搜索失败:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });
  
  // 获取搜索建议（热门搜索）
  router.get('/suggestions', async (req, res) => {
    try {
      // 返回最近的热门新闻标题作为搜索建议
      const results = await collection.find({}, {
        limit: 20
      });
      
      const suggestions = results.map(r => r.title);
      
      res.json({
        success: true,
        data: suggestions
      });
      
    } catch (error) {
      console.error('获取搜索建议失败:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });
  
  return router;
};
