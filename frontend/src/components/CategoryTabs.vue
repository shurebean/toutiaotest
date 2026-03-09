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
import { ref, watch, computed } from 'vue';

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

.custom-tabs :deep(.el-tabs__header) {
  margin: 0;
  padding: 0 20px;
}

.custom-tabs :deep(.el-tabs__nav-wrap) {
  padding: 0 10px;
}

.custom-tabs :deep(.el-tabs__item) {
  padding: 0 20px;
  height: 50px;
  line-height: 50px;
  font-size: 15px;
  color: #606266;
}

.custom-tabs :deep(.el-tabs__item.is-active) {
  color: #409eff;
  font-weight: 600;
}

.custom-tabs :deep(.el-tabs__active-bar) {
  height: 3px;
}

.tab-label {
  display: flex;
  align-items: center;
  gap: 6px;
}

.tab-icon {
  font-size: 18px;
}

.tab-text {
  font-size: 14px;
}
</style>