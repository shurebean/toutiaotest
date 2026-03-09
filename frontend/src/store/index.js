import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import * as api from '../api';

export const useNewsStore = defineStore('news', () => {
  // 状态
  const newsList = ref([]);
  const categories = ref([]);
  const activeCategory = ref(null);
  const searchQuery = ref('');
  const loading = ref(false);
  const error = ref('');
  const page = ref(1);
  const hasMore = ref(true);

  // 计算属性
  const currentNewsList = computed(() => {
    return newsList.value;
  });

  const currentCategory = computed(() => {
    return categories.value.find(c => c.key === c.key);
  });

  // 方法
  const fetchCategories = async () => {
    try {
      const res = await api.getCategories();
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
    }

    try {
      const res = await api.getNews({
        category: searchQuery.value ? undefined : activeCategory.value,
        limit: 20,
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
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const loadMore = async () => {
    if (!hasMore.value || loading.value) return;
    page.value++;
    await fetchNews(false);
  };

  const setSearchQuery = (query) => {
    searchQuery.value = query;
  };

  const setActiveCategory = (category) => {
    activeCategory.value = category;
  };

  const resetNewsList = () => {
    newsList.value = [];
    page.value = 1;
    hasMore.value = true;
    error.value = '';
  };

  const searchNews = async (query) => {
    resetNewsList();
    setSearchQuery(query);
    await fetchNews(true);
  };

  return {
    // 状态
    newsList,
    categories,
    activeCategory,
    searchQuery,
    loading,
    error,
    page,
    hasMore,

    // 计算属性
    currentNewsList,
    currentCategory,

    // 方法
    fetchCategories,
    fetchNews,
    loadMore,
    setSearchQuery,
    setActiveCategory,
    resetNewsList,
    searchNews
  };
});