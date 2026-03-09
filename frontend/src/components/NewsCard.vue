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

.news-image :deep(.el-image) {
  width: 100%;
  height: 100%;
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
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
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

.meta-item .el-icon {
  font-size: 14px;
}

.meta-item.category .el-tag {
  font-weight: 500;
}

.news-actions {
  display: flex;
  gap: 12px;
}

@media (max-width: 768px) {
  .news-card {
    flex-direction: column;
    padding: 16px;
  }
  
  .news-image {
    width: 100%;
    height: 180px;
  }
  
  .news-title {
    font-size: 16px;
  }
  
  .news-meta {
    gap: 12px;
  }
}
</style>