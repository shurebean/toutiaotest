module.exports = (err, req, res, next) => {
  console.error('错误中间件捕获异常:', err);
  
  if (err.name === 'MongoError') {
    return res.status(500).json({
      success: false,
      error: '数据库错误',
      message: err.message
    });
  }
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: '数据验证失败',
      message: err.message
    });
  }
  
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: err.message || '服务器内部错误'
  });
};