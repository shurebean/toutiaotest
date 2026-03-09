# 阶段4：前端开发 - 实施步骤

**阶段时间**: 第12-19天
**预估工时**: 5-7天
**负责人**: 前端开发

---

## 任务4.1：前端项目搭建

**时间**: 第12天
**预估工时**: 1天

### 实施步骤

#### 步骤4.1.1：创建 HTML 入口

```bash
cat > /home/toutiaotest/frontend/index.html << 'EOF'
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8">
    <link rel="icon" type="image/svg+xml" href="/vite.svg">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>今日头条热点 - 实时新闻摘要</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.js"></script>
  </body>
</html>
EOF
```

#### 步骤4.1.2：创建应用入口

```bash
cat > /home/toutiaotest/frontend/src/main.js << 'EOF'
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';

import App from './App.vue';
import './styles/main.css';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(ElementPlus);

app.mount('#app');
EOF
```

#### 步骤4.1.3：创建 Vite 配置

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
- ✅ HTML 入口文件创建
- ✅ 应用入口文件创建
- ✅ Vite 配置正确
- ✅ 依赖已安装

---

## 任务4.2：核心组件开发

**时间**: 第13-14天
**预估工时**: 2天

### 实施步骤

#### 步骤4.2.1：创建新闻卡片组件（Day 13）

```bash
cat > /home/toutiaotest/frontend/src/components/NewsCard.vue << 'EOF'
<template>
  <div class="news-card">
    <div v-if="news.image" class="news-image">
      <el-image
        :src="news.image"
        :preview-src-list="[news.image]"
        fit="cover"
        lazy
      >
        <template #error>
          <div class="image-slot">
            <el-icon><Picture /></el-icon>
          </div>
        </template>
      </el-image>
    </div>
    
    <div class="news-content">
      <h3 class="news-title" :title="news.title">
        {{ news.title }}
      </h3>
      
      <div v-if="news.summary && showSummary" class="news-summary">
        {{ news.summary }}
      </div>
      
      <div class="news-meta">
        <span class="meta-item source">
          <el-icon><User /></el-icon>
          {{ news.source }}
        </span>
        
        <span class="meta-item time">
          <el-icon><Clock /></el-icon>
          {{ formatTime(news.time) }}
        </span>
        
        <span v-if="news.commentCount" class="meta-item comments">
          <el-icon><ChatDotRound /></el-icon>
          {{ formatCommentCount(news.commentCount) }}
        </span>
        
        <span v-if="news.category" class="meta-item category">
          <el-tag size="small">{{ getCategoryName(news.category) }}</el-tag>
        </span>
      </div>
      
      <div class="news-actions">
        <el-button
          type="primary"
          text
          :icon="Link"
          @click="openArticle"
        >
          阅读原文
        </el-button>
        
        <el-button
          v-if="news.summary"
          type="info"
          text
          @click="toggleSummary"
        >
          {{ showSummary ? '收起摘要' : '查看摘要' }}
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { Picture, User, Clock, ChatDotRound, Link } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

const props = defineProps({
  news: {
    type: Object,
    required: true
  }
});

const showSummary = ref(false);

const categoryMap = {
  hot: '热点',
  finance: '财经',
  tech: '科技',
  entertainment: '娱乐',
  sports: '体育',
  world: '国际',
  military: '军事'
};

const formatTime = (time) => {
  if (!time) return '刚刚';
  
  const now = new Date();
  const articleTime = new Date(time);
  const diff = now - articleTime;
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  
  return articleTime.toLocaleDateString('zh-CN');
};

const formatCommentCount = (count) => {
  if (count >= 10000) {
    return (count / 10000).toFixed(1) + '万';
  }
  if (count >= 1000) {
    return (count / 1000).toFixed(1) + 'k';
  }
  return count.toString();
};

const getCategoryName = (key) => {
  return categoryMap[key] || key;
};

const toggleSummary = () => {
  showSummary.value = !showSummary.value;
};

const openArticle = () => {
  if (props.news.url) {
    window.open(props.news.url, '_blank');
  } else {
    ElMessage.warning('原文链接不可用');
  }
};
</script>

<style scoped>
.news-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 16px;
  display: flex;
  gap: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.3s;
}

.news-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.news-image {
  flex-shrink: 0;
  width: 160px;
  height: 100px;
  border-radius: 6px;
  overflow: hidden;
}

.image-slot {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  color: #909399;
}

.news-content {
  flex: 1;
  min-width: 0;
}

.news-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 12px 0;
  line-height: 1.5;
}

.news-summary {
  font-size: 14px;
  color: #606266;
  line-height: 1.6;
  margin-bottom: 12px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 4px;
}

.news-meta {
  display: flex;
;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 12px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #909399;
}

.news-actions {
  display: flex;
  gap: 12px;
}
</style>
EOF
```

#### 步骤4.2.2：创建板块切换组件（Day 13）

```bash
cat > /home/toutiaotest/frontend/src/components/CategoryTabs.vue << 'EOF'
<template>
  <div class="category-tabs">
    <el-tabs
      v-model="activeTab"
      @tab-change="handleTabChange"
      class="custom-tabs"
    >
      <el-tab-pane
        v-for="category in categories"
        :key="category.key"
        :name="category.key"
      >
        <template #label>
          <span class="tab-label">
            <span class="tab-icon">{{ getIcon(category.key) }}</span>
            <span class="tab-text">{{ category.name }}</span>
          </span>
        </template>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  categories: {
    type: Array,
    default: () => []
  },
  activeCategory: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['change']);

const activeTab = ref(props.activeCategory);

watch(() => props.activeCategory, (newVal) => {
  activeTab.value = newVal;
});

const getIcon = (key) => {
  const icons = {
    hot: '🔥',
    finance: '💰',
    tech: '💻',
    entertainment: '🎬',
    sports: '⚽',
    world: '🌍',
    military: '🎖️'
  };
  return icons[key] || '📰';
};

const handleTabChange = (categoryKey) => {
  emit('change', categoryKey);
};
</script>

<style scoped>
.category-tabs {
  margin-bottom: 20px;
}

.custom-tabs {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.custom-tabs :deep(.el-tabs__item) {
  padding: 0 20px;
  height: 50px;
  line-height: 50px;
}

.tab-label {
  display: flex;
  align-items: center;
  gap: 6px;
}

.tab-icon {
  font-size: 18px;
}
</style>
EOF
```

#### 步骤4.2.3：创建搜索框组件（Day 14）

```bash
cat > /home/toutiaotest/frontend/src/components/SearchBar.vue << 'EOF'
<template>
  <div class="search-bar">
    <el-input
      v-model="searchValue"
      placeholder="搜索新闻..."
      clearable
      @keyup.enter="handleSearch"
      @clear="handleClear"
    >
      <template #prefix>
        <el-icon><Search /></el-icon>
      </template>
      <template #append>
        <el-button :icon="Search" @click="handleSearch">
          搜索
        </el-button>
      </template>
    </el-input>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { Search } from '@element-plus/icons-vue';

const props = defineProps({
  value: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['search', 'clear']);

const searchValue = ref(props.value);

watch(() => props.value, (newVal) => {
  searchValue.value = newVal;
});

const handleSearch = () => {
  if (searchValue.value && searchValue.value.trim()) {
    emit('search', searchValue.value.trim());
  }
};

const handleClear = () => {
  searchValue.value = '';
  emit('clear');
};
</script>

<style scoped>
.search-bar {
  margin-bottom: 20px;
}

.search-bar :deep(.el-input-group__append) {
  background: #409eff;
  border-color: #409eff;
  color: white;
}
</style>
EOF
```

### 验收标准
- ✅ 新闻卡片组件创建
- ✅ 板块切换组件创建
- ✅ 搜索框组件创建
- ✅ 组件样式正确

---

## 任务4.3：API集成

**时间**: 第17天
**预估工时**: 1天

### 实施步骤

#### 步骤4.3.1：创建API调用模块

```bash
cat > /home/toutiaotest/frontend/src/api/index.js << 'EOF'
const API_BASE_URL = 'http://localhost:5000/api';

export const getNews = async (params = {}) => {
  try {
    const url = new URL(`${API_BASE_URL}/news`);
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        url.searchParams.append(key, params[key]);
      }
    });
    
    const response = await fetch(url.toString());
    return await response.json();
  } catch (error) {
    console.error('API请求失败:', error);
    return { success: false, error: error.message };
  }
};

export const getCategories = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/categories`);
    return await response.json();
  } catch (error) {
    console.error('API请求失败:', error);
    return { success: false, error: error.message };
  }
};

export const searchNews = async (params) => {
  try {
    const url = new URL(`${API_BASE_URL}/search`);
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        url.searchParams.append(key, params[key]);
      }
    });
    
    const response = await fetch(url.toString());
    return await response.json();
  } catch (error) {
    console.error('API请求失败:', error);
    return { success: false, error: error.message };
  }
};

export default {
  getNews,
  getCategories,
  searchNews
};
EOF
```

### 验收标准
- ✅ API调用模块创建
- ✅ 请求封装正确
- ✅ 错误处理完善

---

## 任务4.4：主应用组件

**时间**: 第15-16天
**预估工时**: 2天

### 实施步骤

#### 步骤4.4.1：创建根组件

```bash
cat > /home/toutiaotest/frontend/src/App.vue << 'EOF'
<template>
  <div id="app">
    <header class="app-header">
      <div class="container">
        <h1 class="app-title">
          <span class="icon">📰</span>
          今日头条热点
        </h1>
        <p class="app-subtitle">实时新闻摘要 · 每2小时更新</p>
      </div>
    </header>

    <main class="app-main">
      <div class="container">
        <CategoryTabs
          :categories="categories"
          :activeCategory="activeCategory"
          @change="handleCategoryChange"
        />

        <SearchBar
          :value="searchQuery"
          @search="handleSearch"
          @clear="handleClearSearch"
        />

        <div v-if="loading" class="loading-container">
          <el-icon class="is-loading"><Loading /></el-icon>
          <p>加载中...</p>
        </div>

        <div v-else-if="error" class="error-container">
          <el-result icon="error" :title="error" sub-title="请稍后重试">
            <template #extra>
              <el-button type="primary" @click="fetchNews">重新加载</el-button>
            </template>
          </el-result>
        </div>

        <div v'else-if="newsList.length === 0" class="empty-container">
          <el-empty description="暂无新闻" />
        </div>

        <div v-else class="news-list">
          <NewsCard
            v-for="news in newsList"
            :key="news._id"
            :news="news"
          />
        </div>

        <div v-if="hasMore" class="load-more">
          <el-button
            :loading="loadingMore"
            @click="loadMore"
          >
            加载更多
          </el-button>
        </div>
      </div>
    </main>

    <footer class="app-footer">
      <div class="container">
        <p>&copy; 2026 今日头条热点抓取系统</p>
        <p>数据来源：今日头条 | 摘要由 AI 生成</p>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { Loading } from '@element-plus/icons-vue';

import CategoryTabs from './components/CategoryTabs.vue';
import SearchBar from './components/SearchBar.vue';
import NewsCard from './components/NewsCard.vue';
import { getCategories, getNews } from './api';

const categories = ref([]);
const activeCategory = ref(null);
const searchQuery = ref('');
const newsList = ref([]);
const loading = ref(false);
const loadingMore = ref(false);
const error = ref('');
const page = ref(1);
const pageSize = 20;
const hasMore = ref(true);

const fetchCategories = async () => {
  try {
    const res = await getCategories();
    if (res.success) {
      categories.value = res.data;
      if (!activeCategory.value && res.data.length > 0) {
        activeCategory.value = res.data[0].key;
      }
    }
  } catch (err) {
    console.error('获取板块失败:', err);
  }
};

const fetchNews = async (reset = true) => {
  if (reset) {
    loading.value = true;
    error.value = '';
    page.value = 1;
    hasMore.value = true;
  } else {
    loadingMore.value = true;
  }

  try {
    const res = await getNews({
      category: searchQuery.value ? undefined : activeCategory.value,
      limit: pageSize,
      page: page.value
    });

    if (res.success) {
      if (reset) {
        newsList.value = res.data;
      } else {
        newsList.value.push(...res.data);
      }

      hasMore.value = res.pagination.total > newsList.value.length;
    } else {
      throw new Error(res.error || '获取新闻失败');
    }
  } catch (err) {
    console.error('获取新闻失败:', err);
    error.value = err.message;
    ElMessage.error(err.message);
  } finally {
    loading.value = false;
    loadingMore.value = false;
  }
};

const loadMore = () => {
  page.value++;
  fetchNews(false);
};

const handleCategoryChange = (category) => {
  if (activeCategory.value !== category) {
    activeCategory.value = category;
    searchQuery.value = '';
    fetchNews(true);
  }
};

const handleSearch = (query) => {
  if (query && query.trim()) {
    searchQuery.value = query.trim();
    fetchNews(true);
  }
};

const handleClearSearch = () => {
  if (searchQuery.value) {
    searchQuery.value = '';
    fetchNews(true);
  }
};

onMounted(async () => {
  await fetchCategories();
  fetchNews(true);
});
</script>

<style scoped>
.app-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 40px 0;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.app-title {
  font-size: 32px;
  font-weight: 700;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
}

.app-title .icon {
  font-size: 36px;
}

.app-subtitle {
  font-size: 16px;
  opacity: 0.9;
  margin: 10px 0 0 0;
}

.app-main {
  padding: 30px 0;
  min-height: 500px;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
  color: #999;
}

.loading-container .el-icon {
  font-size: 48px;
  color: #409eff;
}

.error-container,
.empty-container {
  padding: 60px 0;
}

.news-list {
  margin-top: 20px;
}

.load-more {
  text-align: center;
  padding: 40px 0;
}

.app-footer {
  background: #f5f7fa;
  color: #606266;
  padding: 30px 0;
  text-align: center;
  font-size: 14px;
}

.app-footer p {
  margin: 5px 0;
}
</style>
EOF
```

#### 步骤4.4.2：创建全局样式

```bash
cat > /home/toutiaotest/frontend/src/styles/main.css << 'EOF'
:root {
  --primary-color: #409eff;
  --bg-color: #ffffff;
  --bg-page: #f5f7fa;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html {
  font-size: 16px;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial,
    'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol',
    'Noto Color Emoji';
  font-size: 14px;
  color: #303133;
  background-color: var(--bg-page);
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: var(--bg-page);
}

::-webkit-scrollbar-thumb {
  background: #c0c4cc;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #909399;
}
EOF
```

### 验收标准
- ✅ 根组件创建完成
- ✅ 全局样式创建
- ✅ 组件集成正确

---

## 阶段4总结

### 完成检查清单
- [ ] 前端项目搭建完成
- [ ] 核心组件开发完成
- [ ] API集成完成
- [ ] 主应用组件完成

### 交付物
- ✅ `index.html` - HTML入口
- ✅ `src/main.js` - 应用入口
- ✅ `src/App.vue` - 根组件
- ✅ `src/components/` - 所有组件
- ✅ `src/api/` - API调用模块
- ✅ `src/styles/` - 样式文件

### 测试清单
- [ ] 前端启动测试
- [ ] 组件渲染测试
- [ ] API调用测试
- [ ] 交互功能测试

### 下一步
进入**阶段5：测试与优化**

---

**文档版本**: v1.0
**创建日期**: 2026-03-02
