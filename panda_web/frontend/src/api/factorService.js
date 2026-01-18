const API_BASE = import.meta.env.VITE_API_BASE ?? '';
const API_PREFIX = `${API_BASE}/api/v1`;

const buildQuery = (params = {}) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      search.append(key, String(value));
    }
  });
  const query = search.toString();
  return query ? `?${query}` : '';
};

const fetchJson = async (path, { method = 'GET', body, params } = {}) => {
  const url = `${API_PREFIX}${path}${buildQuery(params)}`;
  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: body ? JSON.stringify(body) : undefined
    });
    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }
    const data = await response.json();
    return { ok: true, data };
  } catch (error) {
    return { ok: false, error };
  }
};

export const getUserFactorList = (params) =>
  fetchJson('/user_factor_list', { params });

export const getFactorDetail = (factorId) =>
  fetchJson('/query_factor', { params: { factor_id: factorId } });

export const getFactorStatus = (factorId) =>
  fetchJson('/query_factor_status', { params: { factor_id: factorId } });

export const runFactor = (factorId) =>
  fetchJson('/run_factor', { params: { factor_id: factorId } });

export const getTaskStatus = (taskId) =>
  fetchJson('/query_task_status', { params: { task_id: taskId } });

export const getTaskLogs = (taskId, lastLogId) =>
  fetchJson('/task_logs', { params: { task_id: taskId, log_id: lastLogId } });

export const getFactorAnalysisData = (taskId) =>
  fetchJson('/query_factor_analysis_data', { params: { task_id: taskId } });

export const getGroupReturnAnalysis = (taskId) =>
  fetchJson('/query_group_return_analysis', { params: { task_id: taskId } });

export const getReturnChart = (taskId) =>
  fetchJson('/query_return_chart', { params: { task_id: taskId } });

export const getIcSequenceChart = (taskId) =>
  fetchJson('/query_ic_sequence_chart', { params: { task_id: taskId } });

export const getRankIcSequenceChart = (taskId) =>
  fetchJson('/query_rank_ic_sequence_chart', { params: { task_id: taskId } });

export const getLastDateTopFactor = (taskId) =>
  fetchJson('/query_last_date_top_factor', { params: { task_id: taskId } });
