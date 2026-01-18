const BASE_URL = 'http://localhost:8111/api/v1';

async function request(url, options = {}) {
  const resp = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const json = await resp.json();
  if (!resp.ok || json.code !== '200') {
    const msg = json?.message || resp.statusText || '请求失败';
    throw new Error(msg);
  }
  return json.data;
}

export async function getUserFactorList({
  user_id = '0',
  page = 1,
  page_size = 7,
  sort_field = 'created_at',
  sort_order = 'desc',
} = {}) {
  const params = new URLSearchParams({
    user_id,
    page: String(page),
    page_size: String(page_size),
    sort_field,
    sort_order,
  });
  return request(`${BASE_URL}/user_factor_list?${params.toString()}`);
}

export async function deleteFactor(factor_id) {
  const params = new URLSearchParams({ factor_id });
  return request(`${BASE_URL}/delete_factor?${params.toString()}`);
}

export async function queryFactor(factor_id) {
  const params = new URLSearchParams({ factor_id });
  return request(`${BASE_URL}/query_factor?${params.toString()}`);
}

export async function updateFactor(factor_id, body) {
  return request(`${BASE_URL}/update_factor?factor_id=${factor_id}`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

