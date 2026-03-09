const express = require('express');
const router = express.Router();

// 板块列表（与配置保持一致）
const categories = [
  { key: 'hot', name: '热点推荐' },
  { key: 'finance', name: '财经' },
  { key: 'tech', name: '科技' },
  { key: 'entertainment', name: '娱乐' },
  { key: 'sports', name: '体育' },
  { key: 'world', name: '国际' },
  { key: 'military', name: '军事' }
];

module.exports = () => {
  // 获取板块列表
  router.get('/', (req, res) => {
    res.json({
      success: true,
      data: categories
    });
  });
  
  // 获取单个板块信息
  router.get('/:key', (req, res) => {
    const { key } = req.params;
    
    const category = categories.find(c => c.key === key);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        error: '板块不存在'
      });
    }
    
    res.json({
      success: true,
      data: category
    });
  });
  
  return router;
};