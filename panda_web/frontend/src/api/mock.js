const buildResponse = (data, message = 'mock ok') => ({
  code: '200',
  message,
  data
});

const buildError = (message = 'mock not implemented') => ({
  code: '500',
  message
});

const today = () => new Date().toISOString().slice(0, 10);

const defaultParams = {
  start_date: today(),
  end_date: today(),
  adjustment_cycle: 5,
  stock_pool: '000300',
  factor_direction: true,
  group_number: 5,
  include_st: false,
  extreme_value_processing: '中位数'
};

let mockFactors = [
  {
    factor_id: 'factor_1001',
    name: '价值动量因子',
    factor_name: 'value_momentum',
    return_ratio: '12.5%',
    sharpe_ratio: 1.24,
    maximum_drawdown: '-8.3%',
    updated_at: '2024-06-12 09:30',
    created_at: '2024-04-01 10:20',
    user_id: 'demo_user',
    factor_type: 'stock',
    is_persistent: false,
    cron: '',
    factor_start_day: '',
    code: 'rank(close / open)',
    code_type: 'formula',
    tags: '价值,动量',
    status: 1,
    describe: '结合价值与动量的因子',
    params: { ...defaultParams }
  },
  {
    factor_id: 'factor_1002',
    name: '成长质量因子',
    factor_name: 'growth_quality',
    return_ratio: '9.8%',
    sharpe_ratio: 1.05,
    maximum_drawdown: '-6.1%',
    updated_at: '2024-06-10 18:05',
    created_at: '2024-03-15 15:40',
    user_id: 'demo_user',
    factor_type: 'stock',
    is_persistent: false,
    cron: '',
    factor_start_day: '',
    code: 'rank(roe / pe)',
    code_type: 'python',
    tags: '成长,质量',
    status: 1,
    describe: '质量成长混合因子',
    params: { ...defaultParams, adjustment_cycle: 10 }
  }
];

const mockTasks = new Map();

const getUrl = (path) => {
  try {
    return new URL(path, window.location.origin);
  } catch (error) {
    return new URL(path, 'http://localhost');
  }
};

const getFactor = (id) => mockFactors.find((factor) => factor.factor_id === id || factor.id === id);

const listFactors = (params = {}) => {
  const page = Number(params.page || 1);
  const pageSize = Number(params.page_size || 10);
  const total = mockFactors.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize;
  const data = mockFactors.slice(start, start + pageSize);
  return buildResponse({
    data,
    total,
    page,
    total_pages: totalPages
  });
};

const upsertFactor = (payload, id) => {
  if (id) {
    const target = getFactor(id);
    if (target) {
      Object.assign(target, payload, { factor_id: id });
      return buildResponse({ factor_id: id }, '更新成功');
    }
  }
  const nextId = `factor_${Date.now()}`;
  const next = {
    factor_id: nextId,
    return_ratio: '0.0%',
    sharpe_ratio: 0,
    maximum_drawdown: '0.0%',
    updated_at: '刚刚',
    created_at: '刚刚',
    ...payload
  };
  mockFactors = [next, ...mockFactors];
  return buildResponse({ factor_id: nextId }, '创建成功');
};

const deleteFactor = (id) => {
  mockFactors = mockFactors.filter((factor) => factor.factor_id !== id);
  return buildResponse({}, '删除成功');
};

const mockFactorAnalysis = {
  ic_mean: 0.052,
  ic_std: 0.12,
  ir: 0.43,
  hit_rate: 0.62
};

const mockCharts = {
  dates: ['2024-01', '2024-02', '2024-03', '2024-04', '2024-05'],
  values: [0.02, 0.03, -0.01, 0.04, 0.05]
};

const mockDataHubResources = {
  data_sources: ['tushare', 'ricequant'],
  tables: ['stock_price_daily', 'factor_daily', 'index_price']
};

const handleApiRequest = ({ path, method, params, body }) => {
  const url = getUrl(path);
  const pathname = url.pathname;
  const searchParams = Object.fromEntries(url.searchParams.entries());
  const payload = body || {};
  const mergedParams = { ...searchParams, ...params };

  if (pathname === '/api/v1/user_factor_list') {
    return listFactors(mergedParams);
  }

  if (pathname === '/api/v1/query_factor') {
    const factor = getFactor(mergedParams.factor_id);
    if (!factor) {
      return buildError('因子不存在');
    }
    return buildResponse(factor);
  }

  if (pathname === '/api/v1/create_factor') {
    return upsertFactor(payload);
  }

  if (pathname === '/api/v1/update_factor') {
    return upsertFactor(payload, mergedParams.factor_id);
  }

  if (pathname === '/api/v1/delete_factor') {
    return deleteFactor(mergedParams.factor_id);
  }

  if (pathname === '/api/v1/run_factor') {
    const taskId = `task_${Date.now()}`;
    mockTasks.set(mergedParams.factor_id, taskId);
    return buildResponse({ task_id: taskId }, '任务已启动');
  }

  if (pathname === '/api/v1/query_factor_status') {
    const taskId = mockTasks.get(mergedParams.factor_id) || `task_${Date.now()}`;
    return buildResponse({ task_id: taskId }, '任务运行中');
  }

  if (pathname === '/api/v1/query_one_group_data') {
    return buildResponse({
      one_group_data: {
        return_ratio: '8.6%',
        annualized_ratio: '21.4%',
        sharpe_ratio: 1.32,
        maximum_drawdown: '-5.4%'
      }
    });
  }

  if (pathname === '/api/v1/query_factor_analysis_data') {
    return buildResponse(mockFactorAnalysis);
  }

  if (pathname === '/api/v1/query_group_return_analysis') {
    return buildResponse({
      groups: [
        { group: 1, return_ratio: '4.2%' },
        { group: 2, return_ratio: '6.1%' },
        { group: 3, return_ratio: '7.5%' },
        { group: 4, return_ratio: '8.9%' },
        { group: 5, return_ratio: '10.2%' }
      ]
    });
  }

  if (pathname.startsWith('/api/v1/query_') || pathname.endsWith('_chart')) {
    return buildResponse(mockCharts);
  }

  if (pathname === '/api/v1/task_logs') {
    return buildResponse({
      logs: [
        '[09:12:01] 拉取行情数据完成',
        '[09:12:21] 计算因子曝光完成',
        '[09:12:45] 回测结果已生成'
      ]
    });
  }

  if (pathname === '/datahub/api/v1/config_redefine_data_source') {
    return buildResponse({ saved: true }, '配置已保存');
  }

  if (pathname === '/datahub/api/v1/get_datahub_resource') {
    return buildResponse(mockDataHubResources);
  }

  if (pathname === '/datahub/api/v1/data_query') {
    return buildResponse({
      total: 2,
      rows: [
        { date: '2024-06-01', table: mergedParams.tables_name, count: 3200 },
        { date: '2024-06-02', table: mergedParams.tables_name, count: 3280 }
      ]
    });
  }

  if (pathname === '/datahub/api/v1/upsert_stockmarket_final') {
    return buildResponse({ task_id: 'stock_clean_01' }, '清洗任务已启动');
  }

  if (pathname === '/datahub/api/v1/get_progress_stock_final') {
    return { code: '200', progress: 62 };
  }

  if (pathname === '/datahub/api/v1/upsert_factor_final') {
    return buildResponse({ task_id: 'factor_clean_01' }, '因子清洗任务已启动');
  }

  if (pathname === '/datahub/api/v1/get_progress_factor_final') {
    return { code: '200', progress: 48 };
  }

  return buildError(`未配置的 mock 接口: ${method} ${pathname}`);
};

export const shouldUseMock = () => import.meta.env.VITE_USE_MOCK === 'true';

export const handleMockRequest = async (request) => {
  const response = handleApiRequest(request);
  return Promise.resolve(response);
};
