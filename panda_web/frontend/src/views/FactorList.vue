<template>
  <section class="view">
    <header class="view-header">
      <div class="title-group">
        <button class="icon-button" type="button">
          <Icon icon="mdi:menu" width="18" height="18" />
        </button>
        <div>
          <div class="title-row">
            <h2>我的因子列表</h2>
            <span class="pill">量化因子资产</span>
          </div>
          <p class="subtitle">展示当前用户的因子回测表现</p>
        </div>
      </div>
      <div class="header-actions">
        <button class="ghost" type="button" @click="goBack">
          <Icon icon="mdi:arrow-left" width="16" height="16" />
          <span class="btn-text">返回因子关系</span>
        </button>
        <button class="primary" type="button" @click="goToEditor">
          <Icon icon="mdi:plus" width="16" height="16" />
          <span class="btn-text">新建因子</span>
        </button>
      </div>
    </header>

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
            <td :class="['return-cell', isPositive(item.return_ratio) ? 'positive' : 'negative']">
              {{ item.return_ratio || '-' }}
            </td>
            <td>{{ formatNumber(item.sharpe_ratio) }}</td>
            <td>{{ item.maximum_drawdown || '-' }}</td>
            <td>{{ formatDateTime(item.updated_at) }}</td>
            <td>{{ formatDateTime(item.created_at) }}</td>
            <td>
              <div class="row-actions">
                <button type="button" @click="goToEditor(item.factor_id)" title="编辑">
                  <Icon icon="mdi:pencil-outline" width="16" height="16" />
                </button>
                <button type="button" @click="copyFactor(item.factor_id)" title="复制">
                  <Icon icon="mdi:content-copy" width="16" height="16" />
                </button>
                <button type="button" @click="runFactor(item.factor_id)" title="运行">
                  <Icon icon="mdi:play-outline" width="16" height="16" />
                </button>
                <button type="button" class="danger" @click="deleteFactor(item.factor_id)" title="删除">
                  <Icon icon="mdi:delete-outline" width="16" height="16" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <p v-else class="empty">暂无数据。</p>

    <footer class="meta" v-if="meta.total_pages > 0">
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
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { apiGet, apiPost } from '../api/client';
import { Icon } from '@iconify/vue';

const auth = useAuthStore();
const router = useRouter();
const loading = ref(false);
const error = ref('');
const items = ref([]);
const meta = reactive({ total: 0, page: 1, total_pages: 1 });
const filters = reactive({
  userId: auth.userId || '0',
  page: 1,
  pageSize: 7,
  sortField: 'created_at',
  sortOrder: 'desc'
});

const isPositive = (ratio) => {
  if (!ratio) return false;
  const value = Number(String(ratio).replace('%', ''));
  return !Number.isNaN(value) && value >= 0;
};

const formatNumber = (value) => {
  const num = Number(value || 0);
  if (Number.isNaN(num)) return '-';
  return num.toFixed(4);
};

const formatDateTime = (value) => {
  if (!value) return '-';
  // 2026-01-18T15:21:45.459539 -> 2026-01-18 15:21:45
  const [datePart, timePart] = String(value).split('T');
  if (!timePart) return value;
  const cleanTime = timePart.split('.')[0];
  return `${datePart} ${cleanTime}`;
};

const loadFactors = async () => {
  if (!filters.userId) {
    error.value = '请填写用户 ID 后再查询。';
    return;
  }
  loading.value = true;
  error.value = '';
  try {
    const response = await apiGet('http://localhost:8111/api/v1/user_factor_list', {
      user_id: filters.userId,
      page: filters.page,
      page_size: filters.pageSize,
      sort_field: filters.sortField,
      sort_frder: filters.sortOrder
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

const goBack = () => {
  router.push({ path: '/factorDeep' });
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
  background: linear-gradient(180deg, rgba(31, 34, 42, 0.95), rgba(24, 27, 35, 0.95));
  padding: 24px;
  border-radius: 18px;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.4);
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

.title-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.title-group h2 {
  margin: 0;
  font-size: 20px;
}

.pill {
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(58, 110, 232, 0.16);
  color: #9fb3ff;
  border: 1px solid rgba(58, 110, 232, 0.5);
}

.header-actions {
  display: flex;
  gap: 12px;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.summary-card {
  background: rgba(42, 46, 57, 0.8);
  border-radius: 14px;
  padding: 16px;
  border: 1px solid rgba(58, 65, 82, 0.6);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.summary-card strong {
  font-size: 20px;
  color: #ff8f66;
}

.summary-card small {
  color: #7a869a;
  font-size: 12px;
}

.toolbar {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
  align-items: end;
  background: #2a2e39;
  padding: 12px;
  border-radius: 12px;
  border: 1px solid rgba(58, 65, 82, 0.5);
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
  display: inline-flex;
  align-items: center;
  gap: 6px;
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
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.table-card {
  background: rgba(42, 46, 57, 0.85);
  border-radius: 14px;
  padding: 8px 12px 16px;
  overflow-x: auto;
  border: 1px solid rgba(58, 65, 82, 0.5);
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

th,
td {
  padding: 14px 12px;
  border-bottom: 1px solid rgba(58, 65, 82, 0.6);
  text-align: left;
}

th {
  color: #a9b4c8;
  font-weight: 500;
}

tbody tr:hover {
  background: rgba(32, 36, 46, 0.6);
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
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.row-actions button:hover {
  border-color: #3a6ee8;
  color: #ffffff;
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
  display: inline-flex;
  align-items: center;
  justify-content: center;
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
