import { handleMockRequest, shouldUseMock } from './mock';

const defaultHeaders = {
  'Content-Type': 'application/json'
};

const toQueryString = (params = {}) => {
  const entries = Object.entries(params).filter(([, value]) => value !== undefined && value !== '');
  if (!entries.length) {
    return '';
  }
  const query = new URLSearchParams();
  for (const [key, value] of entries) {
    query.append(key, value);
  }
  return `?${query.toString()}`;
};

const parseJson = async (response) => {
  const text = await response.text();
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text);
  } catch (error) {
    return { code: response.ok ? '200' : `${response.status}`, message: text };
  }
};

export const apiGet = async (path, params) => {
  if (shouldUseMock()) {
    return handleMockRequest({ path, method: 'GET', params });
  }
  const response = await fetch(`${path}${toQueryString(params)}`, {
    method: 'GET',
    headers: defaultHeaders
  });
  const data = await parseJson(response);
  if (!response.ok) {
    throw new Error(data?.message || `Request failed with ${response.status}`);
  }
  return data;
};

export const apiPost = async (path, body) => {
  if (shouldUseMock()) {
    return handleMockRequest({ path, method: 'POST', body });
  }
  const response = await fetch(path, {
    method: 'POST',
    headers: defaultHeaders,
    body: JSON.stringify(body)
  });
  const data = await parseJson(response);
  if (!response.ok) {
    throw new Error(data?.message || `Request failed with ${response.status}`);
  }
  return data;
};
