const rateLimit = require('express-rate-limit');

// 限流配置工厂
module.exports = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15分钟
    max = 100, // 最多100次请求
    message = '请求过于频繁，请稍后再试'
  } = options;
  
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      error: message,
      retryAfter: windowMs / 1000
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        error: message,
        retryAfter: windowMs / 1000
      });
    }
  });
};