# 阶段1：项目初始化与环境搭建 - 实施步骤

**阶段时间**: 第1-3天
**预估工时**: 2-3天
**负责人**: 后端开发 + 全栈开发

---

## 任务1.1：项目结构创建

**时间**: 第1天上午
**预估工时**: 2小时

### 实施步骤

#### 步骤1.1.1：创建根目录
```bash
cd /home
mkdir -p toutiaotest
cd toutiaotest
```

#### 步骤1.1.2：创建后端目录结构
```bash
cd /home/toutiaotest
mkdir -p backend/{config,scraper,processor,summarizer,scheduler,api/{routes,middleware},models,logs}
```

**验证**:
```bash
tree backend -L 3
```

#### 步骤1.1.3：创建前端目录结构
```bash
mkdir -p frontend/{src/{components,views,api,store,utils,styles},public}
```

**验证**:
```bash
tree frontend -L 3
```

#### 步骤1.1.4：创建目录说明文件
为每个主要目录创建 README.md

```bash
# 后端目录说明
echo "# 后端爬虫模块" > backend/scraper/README.md
echo "# 数据处理模块" > backend/processor/README.md
echo "# AI摘要生成模块" > backend/summarizer/README.md
echo "# 定时任务调度" > backend/scheduler/README.md
echo "# API服务" > backend/api/README.md

# 前端目录说明
echo "# 组件库" > frontend/src/components/README.md
echo "# 页面视图" > frontend/src/views/README.md
echo "# API调用" > frontend/src/api/README.md
echo "# 状态管理" > frontend/src/store/README.md
echo "# 工具函数" > frontend/src/utils/README.md
echo "# 样式文件" > frontend/src/styles/README.md
```

### 验收标准
- ✅ 目录结构完整
- ✅ 每个目录都有 README 说明
- ✅ tree 命令能正常显示目录结构

---

## 任务1.2：环境配置文件

**时间**: 第1天下午
**预估工时**: 3小时

### 实施步骤

#### 步骤1.2.1：创建 .env.example
```bash
cat > /home/toutiaotest/.env.example << 'EOF'
# OpenAI API配置
OPENAI_API_KEY=your_openai_api_key_here

# MongoDB配置
MONGO_URI=mongodb://localhost:27017/toutiao

# 抓取配置
SCRAPE_INTERVAL_HOURS=2
MAX_ARTICLES_PER_CATEGORY=20

# 服务端口
API_PORT=5000
FRONTEND_PORT=3000

# 日志配置
LOG_LEVEL=info
EOF
```

#### 步骤1.2.2：创建 .env
```bash
# 从已获取的API Key配置
cp /home/toutiaotest/.env.example /home/toutiaotest/.env
# 修改API Key（请替换为实际的API Key）
# sed -i 's/your_openai_api_key_here/YOUR_ACTUAL_API_KEY_HERE/' /home/toutiaotest/.env
```

#### 步骤1.2.3：创建 .gitignore
```bash
cat > /home/toutiaotest/.gitignore << 'EOF'
# 依赖
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
package-lock.json
yarn.lock

# 环境变量
.env
.env.local
.env.production

# 日志
logs/
*.log

# 数据库数据
data/
mongodb_data/

# IDE
.vscode/
.idea/
*.swp
*.swo

# 操作系统
.DS_Store
Thumbs.db

# 构建产物
backend/dist/
frontend/dist/

# Docker
.dockerignore

# 临时文件
*.tmp
*.temp
EOF
```

#### 步骤1.2.4：创建 docker-compose.yml
```bash
cat > /home/toutiaotest/docker-compose.yml << 'EOF'
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    volumes:
      - ./backend:/app
      - ./data:/app/data
    restart: unless-stopped

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    depends_on:
      - backend
    restart: unless-stopped
EOF
```

#### 步骤1.2.5：创建后端 Dockerfile
```bash
cat > /home/toutiaotest/backend/Dockerfile << 'EOF'
FROM node:18-alpine

WORKDIR /app

# 安装依赖
COPY package*.json ./
RUN npm install

# 复制源代码
COPY . .

# 暴露端口
EXPOSE 5000

# 启动应用
CMD ["npm", "start"]
EOF
```

#### 步骤1.2.6：创建前端 Dockerfile
```bash
cat > /home/toutiaotest/frontend/Dockerfile << 'EOF'
# 构建阶段
FROM node:18-alpine as builder

WORKDIR /app

# 安装依赖
COPY package*.json ./
RUN npm install

# 复制源代码并构建
COPY . .
RUN npm run build

# 生产阶段
FROM node:18-alpine

WORKDIR /app

# 复制构建产物和依赖
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["npm", "run", "preview"]
EOF
```

#### 步骤1.2.7：创建快速启动脚本
```bash
cat > /home/toutiaotest/quick-start.sh << 'EOF'
#!/bin/bash

echo "🚀 今日头条热点抓取系统 - 快速启动脚本"
echo "============================================"
echo ""

cd /home/toutiaotest

# 启动后端
echo "📦 启动后端服务..."
cd backend
npm start &
BACKEND_PID=$!
cd ..

# 等待后端启动
sleep 3

# 启动前端
echo "🌐 启动前端服务..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ 服务启动完成！"
echo ""
echo "📌 访问地址:"
echo "   - 前端: http://localhost:3000"
echo "   - API: http://localhost:5000"
echo ""
echo "🛑 停止服务: kill $BACKEND_PID $FRONTEND_PID"
echo ""

# 等待任意键退出
read -p "按回车停止所有服务..."
kill $BACKEND_PID $FRONTEND_PID
echo "✅ 所有服务已停止"
EOF

chmod +x /home/toutiaotest/quick-start.sh
```

### 验收标准
- ✅ .env.example 包含所有必要的环境变量
- ✅ .env 文件已正确配置
- ✅ .gitignore 配置正确
- ✅ Docker 配置文件完整
- ✅ quick-start.sh 可执行

---

## 任务1.3：依赖安装

**时间**: 第2天上午
**预估工时**: 4小时

### 实施步骤

#### 步骤1.3.1：后端依赖初始化
```bash
cd /home/toutiaotest/backend

# 创建 package.json
cat > package.json << 'EOF'
{
  "name": "toutiao-hotspots-backend",
  "version": "1.0.0",
  "description": "今日头条热点抓取系统 - 后端",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js",
    "test": "jest"
  },
  "keywords": ["scraper", "news", "toutiao"],
  "author": "",
  "license": "MIT",
  "dependencies": {
    "express": "^4.18.2",
    "puppeteer": "^21.5.0",
    "node-cron": "^3.0.3",
    "better-sqlite3": "^9.0.0",
    "uuid": "^9.0.0",
    "openai": "^4.20.0",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express-rate-limit": "^7.1.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.2",
    "jest": "^29.7.0"
  }
}
EOF

# 安装依赖
npm install
```

**验证**: 检查 node_modules 目录是否生成

#### 步骤1.3.2：前端依赖初始化
```bash
cd /home/toutiaotest/frontend

# 创建 package.json
cat > package.json << 'EOF'
{
  "name": "toutiao-hotspots-frontend",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "vue": "^3.4.0",
    "element-plus": "^2.5.0",
    "axios": "^1.6.0",
    "pinia": "^2.1.0"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.0.0",
    "vite": "^5.0.0"
  }
}
EOF

# 安装依赖
npm install
```

**验证**: 检查 node_modules 目录是否生成

#### 步骤1.3.3：创建 Vite 配置
```bash
cat > /home/toutiaotest/frontend/vite.config.js << 'EOF'
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  }
});
EOF
```

### 验收标准
- ✅ 后端依赖安装成功，无错误
- ✅ 前端依赖安装成功，无错误
- ✅ npm install 命令能正常执行
- ✅ package.json 配置正确

---

## 任务1.4：数据库初始化

**时间**: 第2天下午
**预估工时**: 3小时

### 实施步骤

#### 步骤1.4.1：创建 SQLite 适配器
```bash
cat > /home/toutiaotest/backend/config/sqliteAdapter.js << 'EOF'
const Database = require('better-sqlite3');
const { v4: uuidv4 } = require('uuid');

class SQLiteAdapter {
  constructor(dbPath = './data/news.db') {
    this.db = new Database(dbPath);
    this.collections = {};
    this.initDatabase();
  }

  initDatabase() {
    this.db.exec(\`
      CREATE TABLE IF NOT EXISTS news (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        url TEXT NOT NULL UNIQUE,
        source TEXT,
        time INTEGER,
        commentCount INTEGER,
        image TEXT,
        category TEXT,
        summary TEXT,
        keywords TEXT,
        scrapedAt INTEGER,
        createdAt INTEGER,
        updatedAt INTEGER
      )
    \`);
    console.log('✅ SQLite数据库初始化成功');
  }

  collection(name) {
    if (!this.collections[name]) {
      this.collections[name] = new Collection(this.db, name);
    }
    return this.collections[name];
  }

  close() {
    this.db.close();
  }
}

class Collection {
  constructor(db, name) {
    this.db = db;
    this.name = name;
  }

  async find(query = {}, options = {}) {
    let sql = 'SELECT * FROM ' + this.name;
    const params = [];
    const conditions = [];

    if (query.category) {
      conditions.push('category = ?');
      params.push(query.category);
    }

    if (query.url) {
      conditions.push('url = ?');
      params.push(query.url);
    }

    if (query._id) {
      conditions.push('id = ?');
      params.push(query._id.toString());
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    if (options.sort) {
      const sortKeys = Object.keys(options.sort);
      const orderClauses = sortKeys;
      map(key => {
        const direction = options.sort[key] === 1 ? 'ASC' : 'DESC';
        return key + ' ' + direction;
      });
      sql += ' ORDER BY ' + orderClauses.join(', ');
    }

    if (options.limit) {
      sql += ' LIMIT ' + options.limit;
    }

    if (options.skip) {
      sql += ' OFFSET ' + options.skip;
    }

    const stmt = this.db.prepare(sql);
    const rows = stmt.all(...params);
    return rows.map(row => this._rowToDoc(row));
  }

  async findOne(query) {
    const results = await this.find(query, { limit: 1 });
    return results.length > 0 ? results[0] : null;
  }

  async insertOne(doc) {
    doc.id = doc.id || uuidv4();
    doc.createdAt = doc.createdAt || Date.now();
    doc.updatedAt = doc.updatedAt || Date.now();

    const sql = \`
      INSERT INTO \${this.name} (
        id, title, url, source, time, commentCount, image, category,
        summary, keywords, scrapedAt, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    \`;

    const stmt = this.db.prepare(sql);
    stmt.run(
      doc.id, doc.title, doc.url, doc.source,
      doc.time ? new Date(doc.time).getTime() : 0,
      doc.commentCount || 0,
      doc.image || null,
      doc.category || null,
      doc.summary || null,
      JSON.stringify(doc.keywords || []),
      doc.scrapedAt ? new Date(doc.scrapedAt).getTime() : 0,
      doc.createdAt, doc.updatedAt
    );

    return { insertedId: { toString: () => doc.id } };
  }

  async insertMany(docs) {
    const results = [];
    for (const doc of docs) {
      try {
        const result = await this.insertOne(doc);
        results.push(result.insertedId);
      } catch (error) {
        if (error.code !== 11000) {
          throw error;
        }
      }
    }
    return { insertedIds: results };
  }

  async updateOne(query, update) {
    const conditions = [];
    const params = [];

    if (query._id) {
      conditions.push('id = ?');
      params.push(query._id.toString());
    }

    if (conditions.length === 0) {
      return { modifiedCount: 0 };
    }

    const setClauses = [];
    const setParams = [];

    if (update.$set) {
      Object.keys(update.$set).forEach(key => {
        setClauses.push(key + ' = ?');
        setParams.push(update.$set[key]);
      });
      setClauses.push('updatedAt = ?');
      setParams.push(Date.now());
    }

    if (setClauses.length === 0) {
      return { modifiedCount: 0 };
    }

    const sql = \`UPDATE \${this.name} SET \${setClauses.join(', ')} WHERE \${conditions.join(' AND ')}\`;
    const stmt = this.db.prepare(sql);
    const result = stmt.run(...setParams, ...params);
    return { modifiedCount: result.changes };
  }

  async countDocuments(query) {
    const results = await this.find(query);
    return results.length;
  }

  async createIndex(indexSpec, options) {
    console.log(\`📊 创建索引: \${JSON.stringify(indexSpec)}\`);
    return true;
  }

  _rowToDoc(row) {
    return {
      _id: { toString: () => row.id },
      id: row.id,
      title: row.title,
      url: row.url,
      source: row.source,
      time: row.time ? new Date(row.time) : null,
      commentCount: row.commentCount,
      image: row.image,
      category: row.category,
      summary: row.summary,
      keywords: row.keywords ? JSON.parse(row.keywords) : [],
      scrapedAt: row.scrapedAt ? new Date(row.scrapedAt) : null,
      createdAt: row.createdAt ? new Date(row.createdAt) : null,
      updatedAt: row.updatedAt ? new Date(row.updatedAt) : null
    };
  }
}

module.exports = SQLiteAdapter;
EOF
```

#### 步骤1.4.2：创建数据库测试脚本
```bash
cat > /home/toutiaotest/backend/test-db.js << 'EOF'
const SQLiteAdapter = require('./config/sqliteAdapter');

async function testDatabase() {
  console.log('🧪 开始测试数据库...');
  
  const db = new SQLiteAdapter('./test-news.db');
  const collection = db.collection('news');
  
  // 插入测试数据
  await collection.insertOne({
    title: '测试新闻',
    url: 'https://test.com',
    source: '测试来源',
    category: 'tech',
    scrapedAt: new Date()
  });
  
  // 查询数据
  const news = await collection.find({});
  console.log('✅ 查询结果:', news.length, '条');
  
  db.close();
  console.log('✅ 数据库测试通过！');
}

testDatabase();
EOF
```

#### 步骤1.4.3：运行数据库测试
```bash
cd /home/toutiaotest/backend
node test-db.js
```

### 验收标准
- ✅ SQLite 适配器创建成功
- ✅ 数据库测试脚本运行无错误
- ✅ 数据插入和查询功能正常
- ✅ 数据库文件正确创建

---

## 阶段1总结

### 完成检查清单
- [ ] 项目目录结构创建完成
- [ ] 环境配置文件创建完成
- [ ] 后端依赖安装成功
- [ ] 前端依赖安装成功
- [ ] 数据库适配器创建完成
- [ ] 数据库测试通过

### 交付物
- ✅ 完整的项目目录结构
- ✅ 环境配置文件 (.env, .gitignore)
- ✅ Docker 配置文件
- ✅ 依赖包 (node_modules)
- ✅ 数据库适配器

### 下一步
进入**阶段2：后端核心功能开发**

---

**文档版本**: v1.0
**创建日期**: 2026-03-02
