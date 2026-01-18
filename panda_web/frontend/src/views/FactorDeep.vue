<template>
  <section class="view">
    <header class="deep-header">
      <div class="title-group">
        <button class="icon-button" type="button" @click="goBack">←</button>
        <div>
          <div class="title-row">
            <h2>{{ factorName || '未命名因子' }}</h2>
            <span class="pill">分析中心</span>
          </div>
          <p>收益与深度分析</p>
        </div>
      </div>
      <div class="header-actions">
        <button class="ghost" type="button" @click="checkStatus" :disabled="loading">
          刷新状态
        </button>
        <button class="primary" type="button" @click="loadAll" :disabled="loading">
          {{ loading ? '加载中...' : '加载分析' }}
        </button>
      </div>
    </header>

    <div class="tab-bar">
      <button :class="['tab', activeTab === 'return' ? 'active' : '']" @click="activeTab = 'return'">
        收益
      </button>
      <button :class="['tab', activeTab === 'analysis' ? 'active' : '']" @click="activeTab = 'analysis'">
        深度分析
      </button>
    </div>

    <form class="toolbar" @submit.prevent="loadAll">
      <label>
        Factor ID
        <input v-model="factorId" type="text" />
      </label>
      <label>
        Task ID
        <input v-model="taskId" type="text" />
      </label>
      <button class="primary" type="submit">更新</button>
    </form>

    <p v-if="message" class="message">{{ message }}</p>

    <section v-if="activeTab === 'return'" class="panel-grid">
      <div class="metric-card" v-for="metric in summaryMetrics" :key="metric.label">
        <span>{{ metric.label }}</span>
        <strong>{{ metric.value }}</strong>
      </div>
      <div class="panel">
        <h3>单组收益曲线</h3>
        <pre v-if="simpleReturnChart">{{ simpleReturnChart }}</pre>
        <p v-else class="empty">暂无收益曲线。</p>
      </div>
      <div class="panel">
        <h3>分组收益曲线</h3>
        <pre v-if="returnChart">{{ returnChart }}</pre>
        <p v-else class="empty">暂无分组收益曲线。</p>
      </div>
      <div class="panel">
        <h3>运行日志</h3>
        <pre v-if="taskLogs">{{ taskLogs }}</pre>
        <p v-else class="empty">暂无日志。</p>
      </div>
    </section>

    <section v-else class="panel-grid">
      <div class="panel">
        <h3>因子分析指标</h3>
        <pre v-if="analysisData">{{ analysisData }}</pre>
        <p v-else class="empty">暂无分析指标。</p>
      </div>
      <div class="panel">
        <h3>分组收益分析</h3>
        <pre v-if="groupReturnAnalysis">{{ groupReturnAnalysis }}</pre>
        <p v-else class="empty">暂无分组分析。</p>
      </div>
      <div class="panel">
        <h3>IC 衰减</h3>
        <pre v-if="icDecayChart">{{ icDecayChart }}</pre>
        <p v-else class="empty">暂无数据。</p>
      </div>
      <div class="panel">
        <h3>IC 分布</h3>
        <pre v-if="icDensityChart">{{ icDensityChart }}</pre>
        <p v-else class="empty">暂无数据。</p>
      </div>
      <div class="panel">
        <h3>IC 自相关</h3>
        <pre v-if="icSelfCorrelationChart">{{ icSelfCorrelationChart }}</pre>
        <p v-else class="empty">暂无数据。</p>
      </div>
      <div class="panel">
        <h3>IC 序列</h3>
        <pre v-if="icSequenceChart">{{ icSequenceChart }}</pre>
        <p v-else class="empty">暂无数据。</p>
      </div>
      <div class="panel">
        <h3>Rank IC 衰减</h3>
        <pre v-if="rankIcDecayChart">{{ rankIcDecayChart }}</pre>
        <p v-else class="empty">暂无数据。</p>
      </div>
      <div class="panel">
        <h3>Rank IC 分布</h3>
        <pre v-if="rankIcDensityChart">{{ rankIcDensityChart }}</pre>
        <p v-else class="empty">暂无数据。</p>
      </div>
      <div class="panel">
        <h3>Rank IC 自相关</h3>
        <pre v-if="rankIcSelfCorrelationChart">{{ rankIcSelfCorrelationChart }}</pre>
        <p v-else class="empty">暂无数据。</p>
      </div>
      <div class="panel">
        <h3>Rank IC 序列</h3>
        <pre v-if="rankIcSequenceChart">{{ rankIcSequenceChart }}</pre>
        <p v-else class="empty">暂无数据。</p>
      </div>
    </section>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { apiGet } from '../api/client';

const route = useRoute();
const router = useRouter();
const factorId = ref('');
const taskId = ref('');
const factorName = ref('');
const message = ref('');
const loading = ref(false);
const activeTab = ref('return');

const analysisData = ref('');
const groupReturnAnalysis = ref('');
const icDecayChart = ref('');
const icDensityChart = ref('');
const icSelfCorrelationChart = ref('');
const icSequenceChart = ref('');
const rankIcDecayChart = ref('');
const rankIcDensityChart = ref('');
const rankIcSelfCorrelationChart = ref('');
const rankIcSequenceChart = ref('');
const simpleReturnChart = ref('');
const returnChart = ref('');
const taskLogs = ref('');
const oneGroupData = ref({});

const summaryMetrics = computed(() => [
  { label: '因子收益', value: oneGroupData.value?.return_ratio ?? '-' },
  { label: '年化收益', value: oneGroupData.value?.annualized_ratio ?? '-' },
  { label: '夏普比率', value: oneGroupData.value?.sharpe_ratio ?? '-' },
  { label: '最大回撤', value: oneGroupData.value?.maximum_drawdown ?? '-' }
]);

const checkStatus = async () => {
  if (!factorId.value) {
    message.value = '请输入 factor_id';
    return;
  }
  loading.value = true;
  try {
    const response = await apiGet('/api/v1/query_factor_status', {
      factor_id: factorId.value
    });
    message.value = response?.message || '状态查询完成';
    if (response?.data?.task_id) {
      taskId.value = response.data.task_id;
    }
  } catch (err) {
    message.value = err.message;
  } finally {
    loading.value = false;
  }
};

const fetchIfTask = async (path, setter) => {
  if (!taskId.value) {
    return;
  }
  const response = await apiGet(path, { task_id: taskId.value });
  if (response?.code !== '200') {
    throw new Error(response?.message || '请求失败');
  }
  setter(JSON.stringify(response?.data || {}, null, 2));
};

const loadAll = async () => {
  if (!taskId.value) {
    message.value = '请输入 task_id';
    return;
  }
  loading.value = true;
  try {
    const oneGroup = await apiGet('/api/v1/query_one_group_data', { task_id: taskId.value });
    oneGroupData.value = oneGroup?.data?.one_group_data || oneGroup?.data || {};
    const factorAnalysis = await apiGet('/api/v1/query_factor_analysis_data', { task_id: taskId.value });
    analysisData.value = JSON.stringify(factorAnalysis?.data || {}, null, 2);
    const groupReturn = await apiGet('/api/v1/query_group_return_analysis', { task_id: taskId.value });
    groupReturnAnalysis.value = JSON.stringify(groupReturn?.data || {}, null, 2);
    await fetchIfTask('/api/v1/query_ic_decay_chart', icDecayChart);
    await fetchIfTask('/api/v1/query_ic_density_chart', icDensityChart);
    await fetchIfTask('/api/v1/query_ic_self_correlation_chart', icSelfCorrelationChart);
    await fetchIfTask('/api/v1/query_ic_sequence_chart', icSequenceChart);
    await fetchIfTask('/api/v1/query_rank_ic_decay_chart', rankIcDecayChart);
    await fetchIfTask('/api/v1/query_rank_ic_density_chart', rankIcDensityChart);
    await fetchIfTask('/api/v1/query_rank_ic_self_correlation_chart', rankIcSelfCorrelationChart);
    await fetchIfTask('/api/v1/query_rank_ic_sequence_chart', rankIcSequenceChart);
    await fetchIfTask('/api/v1/query_simple_return_chart', simpleReturnChart);
    await fetchIfTask('/api/v1/query_return_chart', returnChart);
    const logs = await apiGet('/api/v1/task_logs', { task_id: taskId.value });
    taskLogs.value = JSON.stringify(logs?.data || {}, null, 2);
    message.value = '数据已更新';
  } catch (err) {
    message.value = err.message;
  } finally {
    loading.value = false;
  }
};

const loadFactorInfo = async (id) => {
  if (!id) {
    return;
  }
  try {
    const response = await apiGet('/api/v1/query_factor', { factor_id: id });
    if (response?.code === '200') {
      factorName.value = response?.data?.name || '';
    }
  } catch (err) {
    message.value = err.message;
  }
};

const goBack = () => {
  router.push({ path: '/' });
};

onMounted(() => {
  const id = route.query.factor_id;
  if (typeof id === 'string') {
    factorId.value = id;
    loadFactorInfo(id);
    checkStatus();
  }
  const task = route.query.task_id;
  if (typeof task === 'string') {
    taskId.value = task;
  }
});
</script>

<style scoped>
.view {
  background: linear-gradient(180deg, rgba(31, 34, 42, 0.95), rgba(24, 27, 35, 0.95));
  padding: 20px;
  border-radius: 18px;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.4);
  display: flex;
  flex-direction: column;
  gap: 16px;
  color: #e5e9f2;
}

.deep-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
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

.tab-bar {
  display: flex;
  gap: 8px;
}

.tab {
  background: #2a2e39;
  border: 1px solid #3a4152;
  color: #a9b4c8;
  padding: 8px 16px;
  border-radius: 10px;
  cursor: pointer;
}

.tab.active {
  color: #ffffff;
  border-color: #3a6ee8;
  box-shadow: 0 0 0 1px rgba(58, 110, 232, 0.4);
}

.toolbar {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  align-items: end;
  background: rgba(42, 46, 57, 0.85);
  padding: 12px;
  border-radius: 12px;
  border: 1px solid rgba(58, 65, 82, 0.5);
}

label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
  color: #b4bccf;
}

input {
  padding: 8px 10px;
  border: 1px solid #3a4152;
  border-radius: 8px;
  background: #20242e;
  color: #e5e9f2;
}

.panel-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
}

.panel {
  background: rgba(42, 46, 57, 0.85);
  border-radius: 14px;
  padding: 16px;
  min-height: 160px;
  border: 1px solid rgba(58, 65, 82, 0.5);
}

.metric-card {
  background: rgba(42, 46, 57, 0.85);
  border-radius: 14px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  text-align: left;
  border: 1px solid rgba(58, 65, 82, 0.5);
}

.metric-card strong {
  font-size: 20px;
  color: #ff8f66;
}

.primary {
  background: #3a6ee8;
  color: #ffffff;
  border: none;
  padding: 8px 14px;
  border-radius: 8px;
  cursor: pointer;
}

.ghost {
  background: transparent;
  color: #a9b4c8;
  border: 1px solid #3a4152;
  padding: 8px 14px;
  border-radius: 8px;
  cursor: pointer;
}

.ghost:hover {
  border-color: #3a6ee8;
  color: #ffffff;
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

.message {
  color: #9fb3ff;
}

pre {
  white-space: pre-wrap;
  font-size: 12px;
  color: #d8deeb;
}

.empty {
  color: #7a869a;
}
</style>
