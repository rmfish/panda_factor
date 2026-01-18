<template>
  <section class="view">
    <header>
      <h2>Datahub Factor Clean</h2>
      <p>因子数据清洗：/datahub/api/v1/upsert_factor_final</p>
    </header>

    <form class="toolbar" @submit.prevent="startClean">
      <label>
        开始日期
        <input v-model="startDate" type="date" />
      </label>
      <label>
        结束日期
        <input v-model="endDate" type="date" />
      </label>
      <div class="actions">
        <button class="primary" type="submit" :disabled="loading">
          {{ loading ? '启动中...' : '启动清洗' }}
        </button>
        <button type="button" @click="loadProgress">刷新进度</button>
      </div>
    </form>

    <p v-if="message" class="message">{{ message }}</p>

    <div class="progress">
      <span>当前进度：</span>
      <strong>{{ progress }}%</strong>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue';
import { apiGet } from '../api/client';

const startDate = ref('');
const endDate = ref('');
const progress = ref(0);
const message = ref('');
const loading = ref(false);

const startClean = async () => {
  if (!startDate.value || !endDate.value) {
    message.value = '请选择开始与结束日期';
    return;
  }
  loading.value = true;
  message.value = '';
  try {
    const response = await apiGet('/datahub/api/v1/upsert_factor_final', {
      start_date: startDate.value,
      end_date: endDate.value
    });
    message.value = response?.message || '任务已启动';
  } catch (err) {
    message.value = err.message;
  } finally {
    loading.value = false;
  }
};

const loadProgress = async () => {
  try {
    const response = await apiGet('/datahub/api/v1/get_progress_factor_final');
    progress.value = response?.progress || response?.data?.progress || 0;
  } catch (err) {
    message.value = err.message;
  }
};
</script>

<style scoped>
.view {
  background: #ffffff;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 10px 24px rgba(17, 24, 39, 0.08);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.toolbar {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
  align-items: end;
}

label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 14px;
}

input {
  padding: 8px 10px;
  border: 1px solid #d7dce5;
  border-radius: 6px;
}

.actions {
  display: flex;
  gap: 12px;
}

.primary {
  background: #3a6ee8;
  color: #ffffff;
  border: none;
  padding: 8px 14px;
  border-radius: 6px;
  cursor: pointer;
}

.progress {
  font-size: 16px;
  color: #1f2a44;
}
</style>
