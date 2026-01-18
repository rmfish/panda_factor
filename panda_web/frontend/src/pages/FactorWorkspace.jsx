import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Descriptions,
  Form,
  Input,
  Progress,
  Select,
  Space,
  TabPane,
  Tabs,
  Tag,
  TextArea,
  Typography,
  Table,
  Divider
} from '@douyinfe/semi-ui';
import { IconPlayCircle, IconRefresh } from '@douyinfe/semi-icons';
import { useParams } from 'react-router-dom';
import {
  getFactorDetail,
  getFactorStatus,
  getTaskLogs,
  getTaskStatus,
  getFactorAnalysisData,
  getGroupReturnAnalysis,
  getLastDateTopFactor,
  getReturnChart,
  getIcSequenceChart,
  getRankIcSequenceChart,
  runFactor
} from '../api/factorService.js';

const { Title, Text, Paragraph } = Typography;

const defaultFactor = {
  name: '未命名因子',
  factor_name: 'momentum_factor',
  factor_type: 'stock',
  code_type: 'python',
  tags: '动量,趋势',
  describe: '演示用因子定义，可替换为服务端返回内容。',
  status: 0,
  params: {
    start_date: '2021-01-01',
    end_date: '2024-01-01',
    adjustment_cycle: 5,
    stock_pool: '沪深300',
    factor_direction: true,
    group_number: 5,
    include_st: false,
    extreme_value_processing: '标准差'
  },
  code: `class MomentumFactor(Factor):\n    def calculate(self, factors):\n        close = factors['close']\n        returns = close.pct_change(periods=20)\n        return returns.rank()`
};

const defaultLogs = [
  {
    time: '2024-09-18 10:14:32',
    level: 'INFO',
    message: '运行任务已创建，开始加载因子数据。'
  },
  {
    time: '2024-09-18 10:14:36',
    level: 'DEBUG',
    message: '完成因子数据清洗，准备计算分组收益。'
  },
  {
    time: '2024-09-18 10:14:48',
    level: 'INFO',
    message: '因子分析完成，正在写入结果。'
  }
];

const statusMap = {
  0: { label: '未运行', color: 'grey' },
  1: { label: '运行中', color: 'blue' },
  2: { label: '运行成功', color: 'green' },
  3: { label: '运行失败', color: 'red' }
};

const sampleIndicators = [
  { 指标: '年化收益率', python: '27.62%' },
  { 指标: '最大回撤', python: '6.16%' },
  { 指标: '夏普比率', python: '1.606' },
  { 指标: 'IC均值', python: '0.059' }
];

const sampleGroupAnalysis = [
  {
    分组: 'Top组',
    年化收益率: '29.1%',
    超额年化: '12.2%',
    最大回撤: '6.3%',
    超额最大回撤: '4.8%',
    年化波动: '18.5%',
    超额年化波动: '9.2%',
    换手率: '23.1%',
    月度胜率: '62%',
    超额月度胜率: '58%',
    跟踪误差: '2.1%',
    夏普比率: '1.52',
    信息比率: '0.91'
  }
];

const sampleChart = {
  title: '收益率曲线',
  x: [{ name: '日期', data: ['2024-01', '2024-02', '2024-03'] }],
  y: [
    { name: '多空组合', data: [1.2, 1.6, 1.9] },
    { name: '基准', data: [1.0, 1.1, 1.3] }
  ]
};

const sampleIcChart = {
  title: 'IC 序列',
  x: [{ name: '日期', data: ['2024-01', '2024-02', '2024-03'] }],
  y: [
    { name: 'IC', data: [0.05, 0.08, 0.03] },
    { name: '累计IC', data: [0.05, 0.13, 0.16] }
  ]
};

const sampleTopFactors = [
  { date: '2024-09-18', symbol: '600519', python: '2.31' },
  { date: '2024-09-18', symbol: '000001', python: '2.12' }
];

export default function FactorWorkspace() {
  const { factorId } = useParams();
  const [factor, setFactor] = useState(defaultFactor);
  const [taskId, setTaskId] = useState('');
  const [taskStatus, setTaskStatus] = useState(null);
  const [logs, setLogs] = useState(defaultLogs);
  const [indicators, setIndicators] = useState(sampleIndicators);
  const [groupAnalysis, setGroupAnalysis] = useState(sampleGroupAnalysis);
  const [returnChart, setReturnChart] = useState(sampleChart);
  const [icChart, setIcChart] = useState(sampleIcChart);
  const [rankIcChart, setRankIcChart] = useState(sampleIcChart);
  const [topFactors, setTopFactors] = useState(sampleTopFactors);
  const [loadingRun, setLoadingRun] = useState(false);

  const factorStatus = statusMap[factor.status] || statusMap[0];

  const params = factor.params || defaultFactor.params;

  useEffect(() => {
    if (!factorId) return;
    const loadFactor = async () => {
      const response = await getFactorDetail(factorId);
      if (response.ok && response.data?.data) {
        setFactor({ ...defaultFactor, ...response.data.data });
      }
    };
    loadFactor();
  }, [factorId]);

  useEffect(() => {
    if (!factorId) return;
    const loadStatus = async () => {
      const response = await getFactorStatus(factorId);
      if (response.ok && response.data?.data) {
        setTaskId(response.data.data.task_id || '');
        setFactor((prev) => ({ ...prev, status: response.data.data.status ?? prev.status }));
      }
    };
    loadStatus();
  }, [factorId]);

  useEffect(() => {
    if (!taskId) return;
    const loadTaskStatus = async () => {
      const response = await getTaskStatus(taskId);
      if (response.ok && response.data?.data) {
        setTaskStatus(response.data.data);
      }
    };
    loadTaskStatus();
  }, [taskId]);

  const refreshLogs = async () => {
    if (!taskId) return;
    const response = await getTaskLogs(taskId);
    if (response.ok && response.data?.data?.logs) {
      setLogs(response.data.data.logs);
    }
  };

  const refreshReport = async () => {
    if (!taskId) return;
    const [analysis, groupRes, topRes, returnRes, icRes, rankIcRes] = await Promise.all([
      getFactorAnalysisData(taskId),
      getGroupReturnAnalysis(taskId),
      getLastDateTopFactor(taskId),
      getReturnChart(taskId),
      getIcSequenceChart(taskId),
      getRankIcSequenceChart(taskId)
    ]);

    if (analysis.ok && analysis.data?.data?.factor_data_analysis) {
      setIndicators(analysis.data.data.factor_data_analysis);
    }
    if (groupRes.ok && groupRes.data?.data?.group_return_analysis) {
      setGroupAnalysis(groupRes.data.data.group_return_analysis);
    }
    if (topRes.ok && topRes.data?.data?.last_date_top_factor) {
      setTopFactors(topRes.data.data.last_date_top_factor);
    }
    if (returnRes.ok && returnRes.data?.data?.return_chart) {
      setReturnChart(returnRes.data.data.return_chart);
    }
    if (icRes.ok && icRes.data?.data?.ic_seq_chart) {
      setIcChart(icRes.data.data.ic_seq_chart);
    }
    if (rankIcRes.ok && rankIcRes.data?.data?.rank_ic_seq_chart) {
      setRankIcChart(rankIcRes.data.data.rank_ic_seq_chart);
    }
  };

  const handleRun = async () => {
    if (!factorId) return;
    setLoadingRun(true);
    const response = await runFactor(factorId);
    setLoadingRun(false);
    if (response.ok && response.data?.data) {
      setTaskId(response.data.data.task_id || '');
      setFactor((prev) => ({ ...prev, status: 1 }));
    }
  };

  const indicatorColumns = useMemo(
    () => [
      { title: '指标', dataIndex: '指标' },
      { title: '数值', dataIndex: 'python' }
    ],
    []
  );

  return (
    <div className="workspace-shell">
      <Space vertical align="start" spacing="tight">
        <Space align="center" spacing="medium">
          <Title heading={3}>{factor.name}</Title>
          <Tag color={factorStatus.color} type="solid">
            {factorStatus.label}
          </Tag>
        </Space>
        <Text type="tertiary">{factor.describe}</Text>
      </Space>

      <Tabs type="line" className="workspace-tabs" defaultActiveKey="editor">
        <TabPane tab="因子编辑" itemKey="editor">
          <div className="workspace-grid">
            <Card className="workspace-card" title="因子配置">
              <Form layout="vertical" initValues={params} className="workspace-form">
                <Form.Input field="start_date" label="回测开始" placeholder="YYYY-MM-DD" />
                <Form.Input field="end_date" label="回测结束" placeholder="YYYY-MM-DD" />
                <Form.Select
                  field="adjustment_cycle"
                  label="调仓周期"
                  optionList={[
                    { label: '1天', value: 1 },
                    { label: '5天', value: 5 },
                    { label: '20天', value: 20 }
                  ]}
                />
                <Form.Select
                  field="stock_pool"
                  label="股票池"
                  optionList={['沪深300', '中证500', '全A股']}
                />
                <Form.RadioGroup
                  field="factor_direction"
                  label="因子方向"
                  type="button"
                  optionList={[
                    { label: '正向', value: true },
                    { label: '负向', value: false }
                  ]}
                />
                <Form.Slider field="group_number" label="分组数量" min={2} max={20} />
                <Form.Switch field="include_st" label="包含ST" />
                <Form.Select
                  field="extreme_value_processing"
                  label="极值处理"
                  optionList={['标准差', '中位数']}
                />
              </Form>
            </Card>

            <Card className="workspace-card workspace-code" title="Python 模块">
              <Space vertical spacing="tight" className="workspace-code-header">
                <Text type="tertiary">代码类型：{factor.code_type}</Text>
                <Text type="tertiary">标签：{factor.tags}</Text>
              </Space>
              <TextArea
                autosize={{ minRows: 18, maxRows: 22 }}
                value={factor.code}
                className="workspace-editor"
              />
              <Space className="workspace-code-actions">
                <Button theme="solid" type="primary">
                  保存
                </Button>
                <Button icon={<IconPlayCircle />} loading={loadingRun} onClick={handleRun}>
                  运行
                </Button>
              </Space>
            </Card>

            <Card className="workspace-card" title="AI 助手">
              <Space vertical spacing="tight">
                <Text strong>PandaAI 助手</Text>
                <Paragraph type="tertiary">
                  输入需求或日志问题，获得因子调参、诊断建议与示例代码。
                </Paragraph>
                <Input placeholder="描述你的问题或需求..." />
                <Button theme="solid" type="primary">
                  发送
                </Button>
              </Space>
            </Card>
          </div>
        </TabPane>

        <TabPane tab="运行管理" itemKey="runtime">
          <div className="workspace-run-grid">
            <Card className="workspace-card" title="运行状态">
              <Descriptions
                data={[
                  { key: '任务ID', value: taskId || '待运行' },
                  {
                    key: '运行状态',
                    value: (
                      <Tag color={factorStatus.color} type="solid">
                        {factorStatus.label}
                      </Tag>
                    )
                  },
                  { key: '最新消息', value: taskStatus?.last_log_message || '暂无' }
                ]}
                column={1}
              />
              <Divider margin="12px" />
              <Progress
                percent={taskStatus?.process_status ?? 42}
                showInfo
                stroke="var(--semi-color-primary)"
              />
              <Space className="workspace-run-actions">
                <Button icon={<IconRefresh />} onClick={refreshLogs}>
                  刷新日志
                </Button>
                <Button theme="solid" type="primary" onClick={refreshReport}>
                  拉取报告
                </Button>
              </Space>
            </Card>

            <Card className="workspace-card" title="运行日志">
              <div className="workspace-log">
                {logs.map((log, index) => (
                  <div key={`${log.time}-${index}`} className="workspace-log-item">
                    <Text type="tertiary">[{log.time}]</Text>
                    <Tag size="small" color={log.level === 'ERROR' ? 'red' : 'blue'}>
                      {log.level}
                    </Tag>
                    <Text>{log.message}</Text>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </TabPane>

        <TabPane tab="因子报告" itemKey="report">
          <div className="workspace-report-grid">
            <Card className="workspace-card" title="核心指标">
              <Table columns={indicatorColumns} dataSource={indicators} pagination={false} />
            </Card>
            <Card className="workspace-card" title="分组收益分析">
              <Table dataSource={groupAnalysis} pagination={false} />
            </Card>
            <Card className="workspace-card" title={returnChart.title}>
              <Space vertical spacing="tight">
                <Text type="tertiary">X轴：{returnChart.x?.[0]?.name}</Text>
                <Text type="tertiary">Y轴：{returnChart.y?.map((item) => item.name).join(' / ')}</Text>
                <Descriptions
                  data={returnChart.y?.map((series) => ({
                    key: series.name,
                    value: series.data?.join(', ')
                  }))}
                  column={1}
                />
              </Space>
            </Card>
            <Card className="workspace-card" title="最新因子暴露">
              <Table dataSource={topFactors} pagination={false} />
            </Card>
          </div>
        </TabPane>

        <TabPane tab="深度分析" itemKey="analysis">
          <div className="workspace-report-grid">
            <Card className="workspace-card" title={icChart.title}>
              <Descriptions
                data={icChart.y?.map((series) => ({
                  key: series.name,
                  value: series.data?.join(', ')
                }))}
                column={1}
              />
            </Card>
            <Card className="workspace-card" title={rankIcChart.title}>
              <Descriptions
                data={rankIcChart.y?.map((series) => ({
                  key: series.name,
                  value: series.data?.join(', ')
                }))}
                column={1}
              />
            </Card>
          </div>
        </TabPane>
      </Tabs>
    </div>
  );
}
