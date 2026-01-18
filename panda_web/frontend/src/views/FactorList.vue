<template>
  <section class="view">
    <header class="view-header">
      <div class="title-group">
        <button class="icon-button" type="button">☰</button>
        <div>
          <h2>我的因子列表</h2>
          <p>从后端 /api/v1/user_factor_list 拉取用户因子列表。</p>
        </div>
      </div>
      <div class="header-actions">
        <button class="ghost" @click="loadFactors" :disabled="loading">
          {{ loading ? '加载中...' : '刷新' }}
        </button>
        <button class="primary" @click="goToEditor">+ 新增因子</button>
      </div>
    </header>

    <form class="toolbar" @submit.prevent="loadFactors">
      <label>
        用户 ID
        <input v-model="filters.userId" type="text" />
      </label>
      <label>
        页码
        <input v-model.number="filters.page" type="number" min="1" />
      </label>
      <label>
        每页数量
        <input v-model.number="filters.pageSize" type="number" min="1" max="100" />
      </label>
      <label>
        排序字段
        <select v-model="filters.sortField">
          <option value="created_at">created_at</option>
          <option value="updated_at">updated_at</option>
          <option value="return_ratio">return_ratio</option>
          <option value="sharpe_ratio">sharpe_ratio</option>
          <option value="maximum_drawdown">maximum_drawdown</option>
          <option value="IC">IC</option>
          <option value="IR">IR</option>
        </select>
      </label>
      <label>
        排序方式
        <select v-model="filters.sortOrder">
          <option value="desc">desc</option>
          <option value="asc">asc</option>
        </select>
      </label>
      <button class="primary" type="submit">查询</button>
    </form>

    <p v-if="error" class="error">{{ error }}</p>

    <div class="table-card" v-if="items.length">
      <table>
        <thead>
          <tr>
            <th>因子名称</th>
            <th>收益率</th>
            <th>夏普比率</th>
            <th>最大回撤</th>
            <th>最新回测时间</th>
            <th>创建时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in items" :key="item.factor_id">
            <td>
              <strong>{{ item.name }}</strong>
              <div class="muted">{{ item.factor_name }}</div>
            </td>
            <td class="highlight">{{ item.return_ratio }}</td>
            <td>{{ item.sharpe_ratio }}</td>
            <td>{{ item.maximum_drawdown }}</td>
            <td>{{ item.updated_at }}</td>
            <td>{{ item.created_at }}</td>
            <td>
              <div class="row-actions">
                <button type="button" @click="goToEditor(item.factor_id)" title="编辑">✏️</button>
                <button type="button" @click="copyFactor(item.factor_id)" title="复制">📋</button>
                <button type="button" @click="runFactor(item.factor_id)" title="运行">▶️</button>
                <button type="button" class="danger" @click="deleteFactor(item.factor_id)" title="删除">
                  🗑️
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <p v-else class="empty">暂无数据。</p>

    <footer class="meta">
      <button class="ghost" type="button" @click="jumpPage(1)" :disabled="meta.page <= 1">«</button>
      <button class="ghost" type="button" @click="jumpPage(meta.page - 1)" :disabled="meta.page <= 1">
        ‹
      </button>
      <span class="page-pill">{{ meta.page }}</span>
      <button
        class="ghost"
        type="button"
        @click="jumpPage(meta.page + 1)"
        :disabled="meta.page >= meta.total_pages"
      >
        ›
      </button>
      <button
        class="ghost"
        type="button"
        @click="jumpPage(meta.total_pages)"
        :disabled="meta.page >= meta.total_pages"
      >
        »
      </button>
      <span class="muted">总数：{{ meta.total }}</span>
    </footer>
  </section>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { apiGet, apiPost } from '../api/client';

const auth = useAuthStore();
const router = useRouter();
const loading = ref(false);
const error = ref('');
const items = ref([]);
const meta = reactive({ total: 0, page: 1, total_pages: 1 });
const filters = reactive({
  userId: auth.userId || '',
  page: 1,
  pageSize: 10,
  sortField: 'created_at',
  sortOrder: 'desc'
});

const loadFactors = async () => {
  if (!filters.userId) {
    error.value = '请填写用户 ID 后再查询。';
    return;
  }
  loading.value = true;
  error.value = '';
  try {
    const response = await apiGet('/api/v1/user_factor_list', {
      user_id: filters.userId,
      page: filters.page,
      page_size: filters.pageSize,
      sort_field: filters.sortField,
      sort_order: filters.sortOrder
    });
    if (response?.code !== '200') {
      throw new Error(response?.message || '查询失败');
    }
    const payload = response.data || {};
    items.value = payload.data || [];
    meta.total = payload.total || 0;
    meta.page = payload.page || 1;
    meta.total_pages = payload.total_pages || 1;
  } catch (err) {
    error.value = err.message;
    items.value = [];
  } finally {
    loading.value = false;
  }
};

const goToEditor = (factorId) => {
  if (factorId) {
    router.push({ path: '/factorEditor', query: { factor_id: factorId } });
    return;
  }
  router.push({ path: '/factorEditor' });
};

const runFactor = async (factorId) => {
  if (!factorId) {
    return;
  }
  error.value = '';
  try {
    const response = await apiGet('/api/v1/run_factor', { factor_id: factorId });
    if (response?.code !== '200') {
      throw new Error(response?.message || '运行失败');
    }
    router.push({ path: '/factorDeep', query: { factor_id: factorId } });
  } catch (err) {
    error.value = err.message;
  }
};

const copyFactor = async (factorId) => {
  if (!factorId) {
    return;
  }
  error.value = '';
  try {
    const detail = await apiGet('/api/v1/query_factor', { factor_id: factorId });
    if (detail?.code !== '200') {
      throw new Error(detail?.message || '读取因子失败');
    }
    const source = detail?.data || {};
    const payload = {
      user_id: source.user_id || filters.userId,
      name: `${source.name || '未命名因子'}-副本`,
      factor_name: `${source.factor_name || 'factor'}_copy`,
      factor_type: source.factor_type || 'stock',
      is_persistent: source.is_persistent || false,
      cron: source.cron || null,
      factor_start_day: source.factor_start_day || null,
      code: source.code || '',
      code_type: source.code_type || 'python',
      tags: source.tags || '',
      status: 0,
      describe: source.describe || '',
      params: source.params || null
    };
    const response = await apiPost('/api/v1/create_factor', payload);
    if (response?.code !== '200') {
      throw new Error(response?.message || '复制失败');
    }
    await loadFactors();
  } catch (err) {
    error.value = err.message;
  }
};

const deleteFactor = async (factorId) => {
  if (!factorId) {
    return;
  }
  error.value = '';
  try {
    const response = await apiGet('/api/v1/delete_factor', { factor_id: factorId });
    if (response?.code !== '200') {
      throw new Error(response?.message || '删除失败');
    }
    await loadFactors();
  } catch (err) {
    error.value = err.message;
  }
};

const jumpPage = (nextPage) => {
  if (nextPage < 1 || nextPage > meta.total_pages) {
    return;
  }
  filters.page = nextPage;
  loadFactors();
};

onMounted(loadFactors);
</script>

<style scoped>
.view {
  background: #1f222a;
  padding: 24px;
  border-radius: 16px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.35);
  display: flex;
  flex-direction: column;
  gap: 18px;
  color: #e5e9f2;
}

.view-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.title-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.title-group h2 {
  margin: 0;
  font-size: 20px;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.toolbar {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
  align-items: end;
  background: #2a2e39;
  padding: 12px;
  border-radius: 12px;
}

label {
  display: flex;
  flex-direction: column;
  font-size: 14px;
  gap: 6px;
}

input,
select {
  padding: 8px 10px;
  border: 1px solid #3a4152;
  border-radius: 8px;
  background: #20242e;
  color: #e5e9f2;
}

.primary {
  background: #3a6ee8;
  color: #ffffff;
  border: none;
  padding: 8px 14px;
  border-radius: 8px;
  cursor: pointer;
}

.primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.ghost {
  background: transparent;
  color: #a9b4c8;
  border: 1px solid #3a4152;
  padding: 8px 14px;
  border-radius: 8px;
  cursor: pointer;
}

.table-card {
  background: #2a2e39;
  border-radius: 12px;
  padding: 8px 12px 16px;
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

th,
td {
  padding: 14px 12px;
  border-bottom: 1px solid #3a4152;
  text-align: left;
}

th {
  color: #a9b4c8;
  font-weight: 500;
}

.row-actions {
  display: flex;
  gap: 6px;
}

.row-actions button {
  background: #20242e;
  border: 1px solid #3a4152;
  color: #d8deeb;
  padding: 6px 8px;
  border-radius: 6px;
  cursor: pointer;
}

.row-actions button.danger {
  color: #ff6b6b;
  border-color: #59424a;
}

.highlight {
  color: #ff5b5b;
}

.icon-button {
  background: #2a2e39;
  border: 1px solid #3a4152;
  color: #d8deeb;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  cursor: pointer;
}

.error {
  color: #ff6b6b;
}

.empty {
  color: #7a869a;
}

.meta {
  display: flex;
  gap: 16px;
  color: #7a869a;
  font-size: 13px;
  align-items: center;
  justify-content: center;
}

.page-pill {
  padding: 4px 10px;
  border-radius: 6px;
  background: #2a2e39;
  border: 1px solid #3a4152;
}

.muted {
  color: #8f9bb3;
  font-size: 12px;
}
</style>
