<template>
  <section class="view">
    <header class="editor-header">
      <div class="title-group">
        <button class="icon-button" type="button" @click="goBack">←</button>
        <div>
          <h2>{{ form.name || '未命名因子' }}</h2>
          <p>Python 模式</p>
        </div>
      </div>
      <div class="header-actions">
        <button class="ghost" type="button" @click="submitFactor" :disabled="loading">
          保存
        </button>
        <button class="primary" type="button" @click="runFactor" :disabled="loading">
          运行
        </button>
      </div>
    </header>

    <div class="editor-layout">
      <aside class="sidebar">
        <h3>因子配置</h3>
        <label>
          回测区间开始
          <input v-model="form.params.start_date" type="date" />
        </label>
        <label>
          回测区间结束
          <input v-model="form.params.end_date" type="date" />
        </label>
        <label>
          调仓周期
          <select v-model.number="form.params.adjustment_cycle">
            <option v-for="cycle in [1,3,5,10,20,30]" :key="cycle" :value="cycle">
              {{ cycle }} 天
            </option>
          </select>
        </label>
        <label>
          股票池
          <select v-model="form.params.stock_pool">
            <option value="000300">沪深300</option>
            <option value="000905">中证500</option>
            <option value="000852">中证1000</option>
            <option value="000985">全A</option>
          </select>
        </label>
        <label>
          因子方向
          <div class="radio-group">
            <label><input type="radio" :value="true" v-model="form.params.factor_direction" /> 正向</label>
            <label><input type="radio" :value="false" v-model="form.params.factor_direction" /> 负向</label>
          </div>
        </label>
        <label>
          分组数量
          <input v-model.number="form.params.group_number" type="number" min="2" max="20" />
        </label>
        <label>
          是否包含 ST
          <div class="radio-group">
            <label><input type="radio" :value="true" v-model="form.params.include_st" /> 是</label>
            <label><input type="radio" :value="false" v-model="form.params.include_st" /> 否</label>
          </div>
        </label>
        <label>
          极值处理
          <select v-model="form.params.extreme_value_processing">
            <option value="标准差">标准差</option>
            <option value="中位数">中位数</option>
          </select>
        </label>
      </aside>

      <section class="editor-main">
        <div class="editor-toolbar">
          <label>
            代码类型
            <select v-model="form.code_type">
              <option value="formula">formula</option>
              <option value="python">python</option>
            </select>
          </label>
          <label>
            因子名称
            <input v-model="form.name" type="text" />
          </label>
          <label>
            英文名
            <input v-model="form.factor_name" type="text" />
          </label>
        </div>
        <textarea class="code-editor" v-model="form.code" rows="18" />
        <div class="meta-grid">
          <label>
            标签（逗号分隔）
            <input v-model="form.tags" type="text" />
          </label>
          <label>
            描述
            <input v-model="form.describe" type="text" />
          </label>
          <label>
            用户 ID
            <input v-model="form.user_id" type="text" />
          </label>
          <label>
            因子 ID
            <input v-model="form.factorId" type="text" placeholder="更新时填写" />
          </label>
        </div>
      </section>

      <aside class="assistant">
        <h3>AI 助手</h3>
        <div class="assistant-panel">
          <p>你好，我是 PandaAI Chat，欢迎来询问！</p>
          <textarea placeholder="请输入问题..." rows="6" />
          <button class="primary" type="button">发送</button>
        </div>
      </aside>
    </div>

    <p v-if="message" :class="['message', statusClass]">{{ message }}</p>
  </section>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { apiGet, apiPost } from '../api/client';

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();
const loading = ref(false);
const message = ref('');
const statusClass = ref('success');

const createBaseForm = () => ({
  factorId: '',
  user_id: auth.userId || '',
  name: '',
  factor_name: '',
  factor_type: 'stock',
  is_persistent: false,
  cron: '',
  factor_start_day: '',
  code: '',
  code_type: 'formula',
  tags: '',
  status: 0,
  describe: '',
  params: {
    start_date: '',
    end_date: '',
    adjustment_cycle: 1,
    stock_pool: '000300',
    factor_direction: true,
    group_number: 5,
    include_st: false,
    extreme_value_processing: '中位数'
  }
});

const form = reactive(createBaseForm());

const submitFactor = async () => {
  loading.value = true;
  message.value = '';
  try {
    const payload = {
      user_id: form.user_id,
      name: form.name,
      factor_name: form.factor_name,
      factor_type: form.factor_type,
      is_persistent: form.is_persistent,
      cron: form.cron || null,
      factor_start_day: form.factor_start_day || null,
      code: form.code,
      code_type: form.code_type,
      tags: form.tags,
      status: form.status,
      describe: form.describe,
      params: form.params
    };
    const isUpdate = Boolean(form.factorId);
    const path = isUpdate
      ? `/api/v1/update_factor?factor_id=${encodeURIComponent(form.factorId)}`
      : '/api/v1/create_factor';
    const response = await apiPost(path, payload);
    statusClass.value = response?.code === '200' ? 'success' : 'error';
    message.value = response?.message || '提交完成';
  } catch (err) {
    statusClass.value = 'error';
    message.value = err.message;
  } finally {
    loading.value = false;
  }
};

const runFactor = async () => {
  if (!form.factorId) {
    statusClass.value = 'error';
    message.value = '请先保存因子以获取 factor_id';
    return;
  }
  loading.value = true;
  try {
    const response = await apiGet('/api/v1/run_factor', { factor_id: form.factorId });
    statusClass.value = response?.code === '200' ? 'success' : 'error';
    message.value = response?.message || '任务已启动';
    if (response?.code === '200') {
      router.push({ path: '/factorDeep', query: { factor_id: form.factorId } });
    }
  } catch (err) {
    statusClass.value = 'error';
    message.value = err.message;
  } finally {
    loading.value = false;
  }
};

const loadFactor = async (factorId) => {
  if (!factorId) {
    return;
  }
  loading.value = true;
  try {
    const response = await apiGet('/api/v1/query_factor', { factor_id: factorId });
    if (response?.code !== '200') {
      throw new Error(response?.message || '加载失败');
    }
    const data = response?.data || {};
    form.factorId = data.id || data._id || factorId;
    form.user_id = data.user_id || '';
    form.name = data.name || '';
    form.factor_name = data.factor_name || '';
    form.factor_type = data.factor_type || 'stock';
    form.is_persistent = data.is_persistent || false;
    form.cron = data.cron || '';
    form.factor_start_day = data.factor_start_day || '';
    form.code = data.code || '';
    form.code_type = data.code_type || 'python';
    form.tags = data.tags || '';
    form.status = data.status || 0;
    form.describe = data.describe || '';
    if (data.params) {
      Object.assign(form.params, data.params);
    }
  } catch (err) {
    statusClass.value = 'error';
    message.value = err.message;
  } finally {
    loading.value = false;
  }
};

const goBack = () => {
  router.push({ path: '/' });
};

const resetForm = () => {
  Object.assign(form, createBaseForm());
  message.value = '';
};

onMounted(() => {
  const factorId = route.query.factor_id;
  if (typeof factorId === 'string' && factorId) {
    loadFactor(factorId);
  }
});
</script>

<style scoped>
.view {
  background: #1f222a;
  padding: 20px;
  border-radius: 16px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.35);
  display: flex;
  flex-direction: column;
  gap: 16px;
  color: #e5e9f2;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.editor-layout {
  display: grid;
  grid-template-columns: 220px 1fr 260px;
  gap: 16px;
}

.sidebar,
.assistant,
.editor-main {
  background: #2a2e39;
  border-radius: 12px;
  padding: 16px;
}

.sidebar h3,
.assistant h3 {
  margin: 0 0 12px;
  font-size: 14px;
  color: #a9b4c8;
  text-transform: uppercase;
}

label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
  color: #b4bccf;
  margin-bottom: 10px;
}

input,
select,
textarea {
  padding: 8px 10px;
  border: 1px solid #3a4152;
  border-radius: 8px;
  background: #20242e;
  color: #e5e9f2;
}

.editor-toolbar {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
  margin-bottom: 12px;
}

.code-editor {
  width: 100%;
  min-height: 320px;
  background: #1c1f27;
  border: 1px solid #3a4152;
  border-radius: 12px;
  padding: 16px;
  font-family: 'Fira Code', monospace;
  color: #e5e9f2;
}

.meta-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
  margin-top: 12px;
}

.assistant-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
  color: #a9b4c8;
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

.icon-button {
  background: #2a2e39;
  border: 1px solid #3a4152;
  color: #d8deeb;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  cursor: pointer;
}

.radio-group {
  display: flex;
  gap: 12px;
}

.message {
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 14px;
}

.message.success {
  background: #1f3a2a;
  color: #7ce1a1;
}

.message.error {
  background: #3a1f23;
  color: #ff8f8f;
}
</style>
