<template>
  <section class="view">
    <header>
      <h2>Data Hub List</h2>
      <p>查询统计数据：/datahub/api/v1/data_query</p>
    </header>

    <form class="toolbar" @submit.prevent="queryData">
      <label>
        表名
        <input v-model="filters.table" type="text" placeholder="tables_name" />
      </label>
      <label>
        开始日期
        <input v-model="filters.startDate" type="date" />
      </label>
      <label>
        结束日期
        <input v-model="filters.endDate" type="date" />
      </label>
      <label>
        页码
        <input v-model.number="filters.page" type="number" min="1" />
      </label>
      <label>
        每页数量
        <input v-model.number="filters.pageSize" type="number" min="1" max="100" />
      </label>
      <div class="actions">
        <button class="primary" type="submit" :disabled="loading">
          {{ loading ? '加载中...' : '查询' }}
        </button>
      </div>
    </form>

    <p v-if="message" class="message">{{ message }}</p>

    <section class="results">
      <pre v-if="result">{{ result }}</pre>
      <p v-else class="empty">暂无数据。</p>
    </section>
  </section>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { apiGet } from '../api/client';

const loading = ref(false);
const message = ref('');
const result = ref('');

const filters = reactive({
  table: '',
  startDate: '',
  endDate: '',
  page: 1,
  pageSize: 10
});

const queryData = async () => {
  if (!filters.table || !filters.startDate || !filters.endDate) {
    message.value = '请填写表名与日期范围';
    return;
  }
  loading.value = true;
  message.value = '';
  try {
    const response = await apiGet('/datahub/api/v1/data_query', {
      tables_name: filters.table,
      start_date: filters.startDate,
      end_date: filters.endDate,
      page: filters.page,
      page_size: filters.pageSize
    });
    result.value = JSON.stringify(response || {}, null, 2);
  } catch (err) {
    message.value = err.message;
    result.value = '';
  } finally {
    loading.value = false;
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
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
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

.results {
  background: #f8fafc;
  border-radius: 8px;
  padding: 16px;
}

pre {
  white-space: pre-wrap;
  font-size: 12px;
}

.empty {
  color: #7a869a;
}
</style>
