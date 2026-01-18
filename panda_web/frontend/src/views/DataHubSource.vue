<template>
  <section class="view">
    <header class="view-header">
      <div>
        <h2>Data Hub Source</h2>
        <p>配置数据源：/datahub/api/v1/config_redefine_data_source</p>
      </div>
      <button class="primary" type="button" @click="loadResources">
        获取资源
      </button>
    </header>

    <form class="form" @submit.prevent="saveConfig">
      <label>
        Mongo URI
        <input v-model="form.mongo_uri" type="text" />
      </label>
      <label>
        Mongo 用户名
        <input v-model="form.username" type="text" />
      </label>
      <label>
        Mongo 密码
        <input v-model="form.password" type="password" />
      </label>
      <label>
        Auth DB
        <input v-model="form.auth_db" type="text" />
      </label>
      <label>
        DB 名称
        <input v-model="form.db_name" type="text" />
      </label>
      <label>
        数据源
        <input v-model="form.data_source" type="text" placeholder="ricequant / tushare" />
      </label>
      <label>
        数据源用户名
        <input v-model="form.m_user_name" type="text" />
      </label>
      <label>
        数据源密码
        <input v-model="form.m_password" type="password" />
      </label>
      <label>
        Admin Token
        <input v-model="form.admin_token" type="text" />
      </label>
      <label>
        Stock Clean Time
        <input v-model="form.stock_clean_time" type="text" placeholder="08:00" />
      </label>
      <label>
        Factor Clean Time
        <input v-model="form.factor_clean_time" type="text" placeholder="09:00" />
      </label>
      <div class="actions">
        <button class="primary" type="submit" :disabled="loading">
          {{ loading ? '保存中...' : '保存配置' }}
        </button>
      </div>
    </form>

    <p v-if="message" class="message">{{ message }}</p>

    <section class="resources">
      <h3>当前资源</h3>
      <pre v-if="resources">{{ resources }}</pre>
      <p v-else class="empty">暂无资源数据。</p>
    </section>
  </section>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { apiGet, apiPost } from '../api/client';

const loading = ref(false);
const message = ref('');
const resources = ref('');
const form = reactive({
  mongo_uri: '',
  username: '',
  password: '',
  auth_db: '',
  db_name: '',
  data_source: '',
  m_user_name: '',
  m_password: '',
  admin_token: '',
  stock_clean_time: '',
  factor_clean_time: ''
});

const saveConfig = async () => {
  loading.value = true;
  message.value = '';
  try {
    const response = await apiPost('/datahub/api/v1/config_redefine_data_source', form);
    message.value = response?.message || '配置已保存';
  } catch (err) {
    message.value = err.message;
  } finally {
    loading.value = false;
  }
};

const loadResources = async () => {
  try {
    const response = await apiGet('/datahub/api/v1/get_datahub_resource');
    resources.value = JSON.stringify(response || {}, null, 2);
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

.view-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.form {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
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
  grid-column: 1 / -1;
}

.primary {
  background: #3a6ee8;
  color: #ffffff;
  border: none;
  padding: 8px 14px;
  border-radius: 6px;
  cursor: pointer;
}

.resources {
  background: #f8fafc;
  padding: 16px;
  border-radius: 8px;
}

pre {
  white-space: pre-wrap;
  font-size: 12px;
}

.empty {
  color: #7a869a;
}
</style>
