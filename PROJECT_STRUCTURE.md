# 今日头条热点抓取系统 - 项目目录结构

```
toutiao-hotspots/
├── README.md                    # 项目说明文档
├── codeplan.md                  # 详细开发计划
├── .env.example                 # 环境变量模板
├── .env                         # 环境变量配置（不提交）
├── .gitignore                   # Git忽略文件配置
├── docker-compose.yml           # Docker编排文件
├── quick-start.sh              # 快速启动脚本
├── nginx.conf                  # Nginx配置
│
├── backend/                     # 后端服务
│   ├── package.json            # Node.js依赖
│   ├── Dockerfile              # Docker镜像构建
│   ├── index.js                # 应用入口
│   ├── config/                 # 配置文件
│   │   └── index.js           # 主配置文件
│   ├── scraper/                # 爬虫模块
│   │   └── toutiaoScraper.js  # 今日头条爬虫
│   ├── processor/              # 数据处理模块
│   │   └── dataProcessor.js   # 数据清洗
│   ├── summarizer/             # AI摘要生成模块
│   │   └── aiSummarizer.js    # 摘要生成器
│   ├── scheduler/              # 定时任务模块
│   │   └── index.js          # 任务调度
│   ├── api/                    # API服务
│   │   ├── server.js          # Express服务器
│   │   ├── routes/            # 路由定义
│   │   │   ├── news.js       # 新闻相关接口
│   │   │   ├── categories.js # 板块接口
│   │   │   └── search.js     # 搜索接口
│   │   └── middleware/        # 中间件
│   │       ├── auth.js       # 认证中间件
│   │       ├── cache.js      # 缓存中间件
│   │       └── rateLimit.js  # 限流中间件
│   ├── models/                 # 数据模型
│   │   └── News.js            # 新闻数据模型
│   └── logs/                   # 日志目录（不提交）
│       ├── error.log         # 错误日志
│       ├── combined.log      # 综合日志
│       └── scraper.log       # 爬虫日志
│
├── frontend/                    # 前端服务
│   ├── package.json            # Node.js依赖
│   ├── Dockerfile              # Docker镜像构建
│   ├── vite.config.js          # Vite配置
│   ├── index.html              # HTML入口
│   ├── src/
│   │   ├── main.js            # 应用入口
│   │   ├── App.vue            # 根组件
│   │   ├── components/        # 组件
│   │   │   ├── NewsCard.vue  # 新闻卡片
│   │   │   ├── CategoryTabs.vue # 板块切换
│   │   │   ├── SearchBar.vue # 搜索框
│  vs. │   │   � └── SummaryPanel.vue # 摘要面板
│   │   ├── views/             # 页面视图
│   │   │   ├── Home.vue      # 首页
│   │   │   ├── Category.vue  # 板块页
│   │   │   └── Search.vue    # 搜索页
│   │   ├── api/               # API调用
│   │   │   └── index.js      # API封装
│   │   ├── store/             # 状态管理
│   │   │   └── index.js      # Pinia store
│   │   ├── utils/             # 工具函数
│   │   │   ├── time.js       # 时间格式化
│   │   │   └── storage.js    # 本地存储
│   │   └── styles/            # 样式文件
│   │       ├── main.css      # 全局样式
│   │       └── variables.css # CSS变量
│   └── public/                # 静态资源
│       ├── favicon.ico
│       └── logo.png
│
└── ssl/                        # SSL证书（不提交）
    ├── cert.pem
    └── key.pem
```

## 核心文件说明

### 根目录文件

- **README.md**: 项目整体说明文档，包含技术栈、架构图、功能模块介绍
- **codeplan.md**: 详细的开发计划，包含7个阶段的任务分解和时间安排
- **.env.example**: 环境变量配置模板
- **docker-compose.yml**: Docker容器编排配置
- **quick-start.sh**: 一键启动脚本

### backend/ 目录

#### 配置文件
- **config/index.js**: 主配置文件，包含爬虫、数据库、OpenAI、API等所有配置

#### 入口文件
- **index.js**: 应用入口，负责初始化所有模块并启动服务

#### 核心模块
- **scraper/toutiaoScraper.js**: 使用Puppeteer抓取今日头条新闻
- **processor/dataProcessor.js**: 数据清洗、去重、存储到数据库
- **summarizer/aiSummarizer.js**: 调用OpenAI API生成新闻摘要
- **scheduler/index.js**: 使用node-cron实现定时任务调度

#### API服务
- **api/server.js**: Express API服务器
- **api/routes/**: 各类API路由
- **api/middleware/**: 中间件（认证、缓存、限流）

### frontend/ 目录

#### 入口文件
- **index.html**: HTML入口文件
- **src/main.js**: Vue应用入口
- **src/App.vue**: 根组件

#### 组件
- **components/NewsCard.vue**: 新闻卡片组件
- **components/CategoryTabs.vue**: 板块切换组件
- **components/SearchBar.vue**: 搜索框组件

#### 页面视图
- **views/Home.vue**: 首页，展示新闻列表
- **views/Category.vue**: 板块页
- **views/Search.vue**: 搜索结果页

#### 功能模块
- **api/index.js**: API调用封装
- **store/index.js**: Pinia状态管理
- **utils/**: 工具函数

## 数据库Schema

### News Collection

```javascript
{
  _id: ObjectId,              // 文档ID
  title: String,              // 新闻标题
  url: String,                // 新闻URL（唯一索引）
  source: String,             // 来源
  time: Date,                 // 发布时间
  commentCount: Number,       // 评论数
  image: String,              // 封面图片URL
  category: String,           // 板块分类
  summary: String,            // AI生成的摘要
  keywords: [String],         // 提取的关键词
  scrapedAt: Date,            // 抓取时间
  createdAt: Date,            // 创建时间
  updatedAt: Date             // 更新时间
}
```

## 索引说明

- `{ url: 1 }`: 唯一索引，用于去重
- `{ category: 1 }`: 板块索引
- `{ scrapedAt: -1 }`: 按抓取时间降序
- `{ title: "text", summary: "text" }`: 全文搜索索引

## 环境变量说明

```bash
# OpenAI API配置
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxx

# MongoDB配置
MONGO_URI=mongodb://localhost:27017/toutiao

# 抓取配置
SCRAPE_INTERVAL_HOURS=2        # 抓取间隔（小时）
MAX_ARTICLES_PER_CATEGORY=20   # 每个板块最大文章数

# 服务端口
API_PORT=5000                  # 后端API端口
FRONTEND_PORT=3000             # 前端端口

# 日志配置
LOG_LEVEL=info                # 日志级别
```

## 开发命令

### 后端开发

```bash
cd backend

# 安装依赖
npm install

# 开发模式启动
npm run dev

# 生产模式启动
npm start

# 运行测试
npm test
```

### 前端开发

```bash
cd frontend

# 安装依赖
npm install

# 开发模式启动
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

### Docker部署

```bash
# 构建并启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f backend

# 停止服务
docker-compose down

# 停止并删除数据卷
docker-compose down -v
```

## 端口说明

- **27017**: MongoDB数据库
- **5000**: 后端API服务
- **80**: 前端Web服务
- **443**: HTTPS访问（Nginx反向代理）

## 日志说明

- **backend/logs/error.log**: 错误日志
- **backend/logs/combined.log**: 综合日志
- **backend/logs/scraper.log**: 爬虫专用日志

## 性能优化建议

1. **Redis缓存** - 缓存热门新闻和搜索结果
2. **数据库索引** - 为url、category、scrapedAt建立索引
3. **请求限流** - 使用Redis实现API限流
4. **CDN加速** - 前端静态资源使用CDN
5. **图片懒加载** - 前端图片使用懒加载
6. **分页加载** - 前端实现无限滚动
