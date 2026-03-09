module.exports = {
  // 爬虫配置
  scraper: {
    // 今日头条URL
    baseUrl: 'https://www.toutiao.com',
    
    // 板块配置
    categories: {
      hot: '热点推荐',
      finance: '财经',
      tech: '科技',
      entertainment: '娱乐',
      sports: '体育',
      world: '国际',
      military: '军事'
    },
    
    // 请求间隔（毫秒）
    requestInterval: 2000,
    
    // 每个板块最大抓取数
    maxArticlesPerCategory: 20,
    
    // 超时时间（毫秒）
    timeout: 30000,
    
    // Puppeteer配置
    puppeteer: {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ]
    }
  },
  
  // 数据库配置
  database: {
    url: process.env.MONGO_URI || 'mongodb://localhost:27017/toutiao',
    options: {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    }
  },
  
  // OpenAI配置
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: 'gpt-3.5-turbo',
    maxTokens: 200,
    temperature: 0.7,
    batchSize: 5,
    requestInterval: 1000
  },
  
  // 定时任务配置
  scheduler: {
    interval: process.env.SCRAPE_INTERVAL_HOURS || 2,
    cronPattern: '0 */2 * * *' // 每2小时执行一次
  },
  
  // API配置
  api: {
    port: process.env.API_PORT || 5000,
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization']
    },
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15分钟
      max: 100 // 每个IP最多100次请求
    }
  },
  
  // 日志配置
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    dir: './logs',
    files: {
      error: 'error.log',
      combined: 'combined.log',
      scraper: 'scraper.log'
    }
  }
};