// 请求日志中间件
module.exports = (req, res, next) => {
  const start = Date.now();
  
  // 记录请求
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  
  // 监听响应完成
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`);
  });
  
  next();
};