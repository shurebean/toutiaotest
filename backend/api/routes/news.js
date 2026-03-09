const express = require('express');
const router = express.Router();

module.exports = (db) => {
  const collection = db.collection('news');
  
  // 获取新闻列表
  router.get('/', async (req, res) => {
    try {
      const { 
        category, 
        limit = 10, 
        page = 1,
        sort = 'desc',
        withSummary = 'false'
      } = req.query;
      
      const limitNum = parseInt(limit);
      const pageNum = parseInt(page);
      const skipNum = (pageNum - 1) * limitNum;
      const sortNum = sort === 'asc' ? 1 : -1;
      
      // 构建查询条件
      const query = category ? { category } : {};
      
      // 查询数据
      const news = await collection.find(query, {
        sort: { createdAt: sortNum },
        skip: skipNum,
        limit: limitNum
      });
      
      // 计算总数
      const total = await collection.countDocuments(query);
      
      // 如果不需要摘要，过滤掉summary字段以减少数据传输
      const responseNews = withSummary === 'true' 
        ? news 
        : news.map(item => {
            const { summary, ...rest } = item;
            return rest;
          });
      
      res.json({
        success: true,
        data: responseNews,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      });
      
    } catch (error) {
      console.error('获取新闻列表失败:', error);
      res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }
  });
  
  // 获取单条新闻
  router.get('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      
      const news = await collection.findOne({ _id: id });
      
      if (!news) {
        return res.status(404).json({ 
          success: false,
          error: '新闻不存在' 
        });
      }
      
      res.json({
        success: true,
        data: news
      });
      
    } catch (error) {
      console.error('获取新闻详情失败:', error);
      res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }
  });
  
  // 获取最新新闻（所有板块）
  router.get('/latest/all', async (req, res) => {
    try {
      const { limit = 50 } = req.query;
      const limitNum = parseInt(limit);
      
      const news = await collection.find({}, {
        sort: { createdAt: -1 },
        limit: limitNum
      });
      
      // 按板块分组
      const grouped = {};
      news.forEach(item => {
        if (!grouped[item.category]) {
          grouped[item.category] = [];
        }
        grouped[item.category].push(item);
      });
      
      res.json({
        success: true,
        data: grouped,
        total: news.length
      });
      
    } catch (error) {
      console.error('获取最新新闻失败:', error);
      res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }
  });
  
  // 获取热门新闻（按评论数排序）
  router.get('/hot/list', async (req, res) => {
    try {
      const { limit = 20, category } = req.query;
      const limitNum = parseInt(limit);
      
      const query = category ? { category } : {};
      
      const news = await collection.find(query, {
        sort: { commentCount: -1 },
        limit: limitNum
      });
      
      res.json({
        success: true,
        data: news
      });
      
    } catch (error) {
      console.error('获取热门新闻失败:', error);
      res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }
  });
  
  return router;
};