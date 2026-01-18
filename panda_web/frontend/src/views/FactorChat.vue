<template>
  <section class="view">
    <header>
      <h2>Factor Chat</h2>
      <p>读取任务日志 /api/v1/task_logs。</p>
    </header>

    <form class="toolbar" @submit.prevent="loadLogs">
      <label>
        Task ID
        <input v-model="taskId" type="text" />
      </label>
      <label>
        Last Log ID（增量）
        <input v-model="lastLogId" type="text" />
      </label>
      <div class="actions">
        <button class="primary" type="submit" :disabled="loading">
          {{ loading ? '加载中...' : '加载日志' }}
        </button>
        <button type="button" @click="clearLogs">清空</button>
      </div>
    </form>

    <p v-if="message" class="message">{{ message }}</p>

    <section class="logs">
      <pre v-if="logs">{{ logs }}</pre>
      <p v-else class="empty">暂无日志。</p>
    </section>
  </section>
</template>

<script setup>
import { ref } from 'vue';
import { apiGet } from '../api/client';

const taskId = ref('');
const lastLogId = ref('');
const logs = ref('');
const message = ref('');
const loading = ref(false);

const loadLogs = async () => {
  if (!taskId.value) {
    message.value = '请输入 task_id';
    return;
  }
  loading.value = true;
  message.value = '';
  try {
    const response = await apiGet('/api/v1/task_logs', {
      task_id: taskId.value,
      last_log_id: lastLogId.value || undefined
    });
    message.value = response?.message || '日志加载完成';
    logs.value = JSON.stringify(response?.data || {}, null, 2);
  } catch (err) {
    message.value = err.message;
    logs.value = '';
  } finally {
    loading.value = false;
  }
};

const clearLogs = () => {
  logs.value = '';
  message.value = '';
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

.logs {
  background: #f8fafc;
  border-radius: 8px;
  padding: 16px;
  min-height: 160px;
}

pre {
  white-space: pre-wrap;
  font-size: 12px;
}

.empty {
  color: #7a869a;
}
</style>
