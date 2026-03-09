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

        <div v-else-if="newsList.length === 0" class="empty-container">
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

// 状态
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

// 获取板块列表
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

// 获取新闻列表
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

// 加载更多
const loadMore = () => {
  page.value++;
  fetchNews(false);
};

// 板块切换
const handleCategoryChange = (category) => {
  if (activeCategory.value !== category) {
    activeCategory.value = category;
    searchQuery.value = '';
    fetchNews(true);
  }
};

// 搜索
const handleSearch = (query) => {
  if (query && query.trim()) {
    searchQuery.value = query.trim();
    fetchNews(true);
  }
};

// 清除搜索
const handleClearSearch = () => {
  if (searchQuery.value) {
    searchQuery.value = '';
    fetchNews(true);
  }
};

// 初始化
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