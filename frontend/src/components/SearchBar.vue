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

.search-bar :deep(.el-input-group__append:hover) {
  background: #66b1ff;
  border-color: #66b1ff;
}
</style>