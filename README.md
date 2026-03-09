# 今日头条热点抓取系统 - 设计方案

## 项目概述

设计一个在线网站，每隔2小时自动抓取今日头条的最新热点，按不同板块分类生成摘要，并提供Web界面展示。

## 技术栈

### 后端
- **框架**: Node.js + Express
- **爬虫**: Puppeteer (处理动态内容)
- **定时任务**: node-cron
- **数据库**: MongoDB (存储新闻数据)
- **AI摘要**: OpenAI API (生成新闻摘要)
- **部署**: Docker + Nginx

### 前端
- **框架**: Vue 3
- **UI组件库**: Element Plus
- **状态管理**: Pinia
- **构建工具**: Vite

## 系统架构

```
┌─────────────┐     ┌─────────────┐     ┌┬───────┐
│   定时任务   │ ───▶│   爬虫模块   │ ───▶│  数据清洗    │
│ (2小时触发) │     │  (Puppeteer)│     │  (分类去重)  │
└─────────────┘     └─────────────┘     └─────────────┘
                                               │
                                               ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   前端展示   │ ◀───│   API服务    │ ◀───│  数据库     │
│  (Vue 3)     │     │  (Express)  │     │  (MongoDB)  │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                           ▼
                   ┌─────────────┐
                   │  AI摘要生成  │
                   │  (异步处理)  │
                   └─────────────┘
```

## 核心功能模块

### 1. 爬虫模块 (scraper/)

**目标页面**: `https://www.toutiao.com`

**抓取板块**:
- 热点推荐
- 财经
- 科技
- 娱乐
- 体育
- 国际
- 军事

### 2. 数据清洗模块 (processor/)

**功能**:
- 去重（基于URL或标题）
- 数据格式化
- 关键词提取
- 时间戳统一

### 3. AI摘要生成模块 (summarizer/)

**功能**:
- 批量生成新闻摘要
- 异步处理
- 错误重试

### 4. 定时任务模块 (scheduler/)

**功能**:
- 使用node-cron实现定时调度
- 每2小时自动触发抓取
- 支持手动触发
- 任务状态监控

### 5. API服务模块 (api/)

**接口列表**:
- `GET /api/news` - 获取新闻列表
- `GET /api/categories` - 获取板块列表
- `GET /api/search` - 搜索新闻
- `POST /api/scrape` - 手动触发抓取

### 6. 前端界面 (frontend/)

**组件结构**:
```
frontend/
├── src/
│   ├── components/
│   │   ├── NewsCard.vue      # 新闻卡片
│   │   ├── CategoryTabs.vue  # 板块切换
│   │   └── SearchBar.vue     # 搜索框
│   ├── views/
│   │   ├── Home.vue          # 首页
│   │   └── Category.vue      # 板块页
│   ├── App.vue
│   └── main.js
└── package.json
```

## 部署方案

### Docker Compose

```yaml
version: '3.8'

services:
  # MongoDB数据库
  mongodb:
    image: mongo:latest
    volumes:
      - mongodb_data:/data/db
    ports:
      - "27017:27017"

  # 后端API
  backend:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      - MONGO_URL=mongodb://mongodb:27017/toutiao
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    depends_on:
      - mongodb

  # 前端
  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend

  # Nginx反向代理
  nginx:
    image: nginx:latest
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    ports:
      - "443:443"
    depends_on:
      - frontend
      - backend

volumes:
  mongodb_data:
```

## 注意事项

### 1. 反爬虫应对
- 使用代理IP池
- 随机User-Agent
- 请求频率控制
- Cookie管理

### 2. 数据去重策略
- URL去重
- 标题相似度判断
- 24小时内重复内容过滤

### 3. API限流
- OpenAI API每分钟请求数限制
- 实现请求队列和重试机制

### 4. 监控和告警
- 抓取失败告警
- 数据库连接监控
- API调用异常监控

### 5. 合规性
- 遵守今日头条robots.txt
- 注明新闻来源
- 避免直接复制全文，仅展示摘要

## 扩展功能

- [ ] 用户订阅通知
- [ ] 新闻趋势分析
- [ ] 关键词云展示
- [ ] 数据统计仪表板
- [ ] 多平台抓取（微博、知乎等）
- [ ] 用户收藏和分享功能

## License

MIT
