const API_BASE_URL = 'http://localhost:5000/api';

// 获取新闻列表
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
    return {
      success: false,
      error: error.message
    };
  }
};

// 获取单条新闻
export const getNewsById = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/news/${id}`);
    return await response.json();
  } catch (error) {
    console.error('API请求失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// 获取板块列表
export const getCategories = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/categories`);
    return await response.json();
  } catch (error) {
    console.error('API请求失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// 搜索新闻
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
    return {
      success: false,
      error: error.message
    };
  }
};

// 获取搜索建议
export const getSearchSuggestions = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/search/suggestions`);
    return await response.json();
  } catch (error) {
    console.error('API请求失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// 手动触发抓取
export const triggerScrape = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/scrape`, {
      method: 'POST'
    });
    return await response.json();
  } catch (error) {
    console.error('API请求失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// 获取调度器状态
export const getSchedulerStatus = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/scheduler/status`);
    return await response.json();
  } catch (error) {
    console.error('API请求失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// 获取最新新闻（所有板块）
export const getLatestNews = async (params = {}) => {
  try {
    const url = new URL(`${API_BASE_URL}/news/latest/all`);
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        url.searchParams.append(key, params[key]);
      }
    });
    
    const response = await fetch(url.toString());
    return await response.json();
  } catch (error) {
    console.error('API请求失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// 获取热门新闻
export const getHotNews = async (params = {}) => {
  try {
    const url = new URL(`${API_BASE_URL}/news/hot/list`);
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        url.searchParams.append(key, params[key]);
      }
    });
    
    const response = await fetch(url.toString());
    return await response.json();
  } catch (error) {
    console.error('API请求失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export default {
  getNews,
  getNewsById,
  getCategories,
  searchNews,
  getSearchSuggestions,
  triggerScrape,
  getSchedulerStatus,
  getLatestNews,
  getHotNews
};