import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AIChatDialogue,
  AIChatInput,
  Button,
  Card,
  Form,
  Space,
  Tooltip,
  Tag,
  Typography,
  Divider,
  chatInputToMessage
} from '@douyinfe/semi-ui-19';
import {
  IconArrowLeft,
  IconPlayCircle,
  IconFullScreenStroked,
  IconShrinkScreenStroked
} from '@douyinfe/semi-icons';
import MonacoEditor from '@monaco-editor/react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  getFactorDetail,
  getFactorStatus,
  getTaskLogs,
  getTaskStatus,
  runFactor
} from '../api/factorService.js';

const { Title, Text } = Typography;

const defaultFactor = {
  name: '未命名因子',
  factor_name: 'momentum_factor',
  factor_type: 'stock',
  code_type: 'python',
  tags: '动量,趋势',
  describe: '演示用因子定义，可替换为服务端返回内容。',
  status: 0,
  params: {
    date_range:['2023-01-01','2025-01-01'],
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
  },
    {
    time: '2024-09-18 10:24:32',
    level: 'INFO',
    message: '运行任务已创建，开始加载因子数据。'
  },
  {
    time: '2024-09-18 10:24:36',
    level: 'DEBUG',
    message: '完成因子数据清洗，准备计算分组收益。'
  },
  {
    time: '2024-09-18 10:24:48',
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

const defaultChatMessages = [
  {
    id: 'chat-1',
    role: 'assistant',
    name: 'PandaAI',
    content: '你好，我可以帮你分析因子表现、调参和排查日志问题。'
  }
];

const chatRoleConfig = {
  user: { name: '你' },
  assistant: new Map([
    [
      'PandaAI',
      {
        name: 'PandaAI'
      }
    ]
  ])
};

const editorLineHeight = 18;
const minEditorLines = 20;
const minEditorHeight = editorLineHeight * minEditorLines;

const normalizeLogEntry = (log) => ({
  time: log.time ?? log.timestamp ?? '-',
  level: log.level ?? log.loglevel ?? 'INFO',
  message: log.message ?? ''
});

export default function FactorDetail() {
  const navigate = useNavigate();
  const { factorId } = useParams();
  const [factor, setFactor] = useState(defaultFactor);
  const [taskId, setTaskId] = useState('');
  const [taskStatus, setTaskStatus] = useState(null);
  const [consoleLogs, setConsoleLogs] = useState(defaultLogs);
  const lastLogIdRef = useRef('');
  const [isConsoleCollapsed, setIsConsoleCollapsed] = useState(false);
  const [chatMessages, setChatMessages] = useState(defaultChatMessages);
  const [chatGenerating, setChatGenerating] = useState(false);
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

  const loadTaskStatus = async () => {
    if (!taskId) return;
    const response = await getTaskStatus(taskId);
    if (response.ok && response.data?.data) {
      setTaskStatus(response.data.data);
    }
  };

  const loadTaskLogs = async () => {
    if (!taskId) return;
    const response = await getTaskLogs(taskId, lastLogIdRef.current);
    if (response.ok && response.data?.data?.logs) {
      const incomingLogs = response.data.data.logs.map(normalizeLogEntry);
      setConsoleLogs((prev) => [...prev, ...incomingLogs]);
      if (response.data.data.last_log_id) {
        lastLogIdRef.current = response.data.data.last_log_id;
      }
    }
  };

  useEffect(() => {
    if (!taskId) return;
    lastLogIdRef.current = '';
    setConsoleLogs([]);
    loadTaskStatus();
    loadTaskLogs();
  }, [taskId]);

  useEffect(() => {
    if (!taskId) return;
    if (taskStatus?.process_status === 100 || taskStatus?.error_message || taskStatus?.result) {
      return;
    }
    const intervalId = setInterval(() => {
      loadTaskStatus();
      loadTaskLogs();
    }, 5000);
    return () => clearInterval(intervalId);
  }, [taskId, taskStatus?.process_status, taskStatus?.error_message]);

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

  const onChatSend = useCallback((props) => {
    setChatGenerating(true);
    setChatMessages((prev) => [
      ...prev,
      { id: `chat-${Date.now()}`, ...chatInputToMessage(props) }
    ]);
    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        {
          id: `chat-${Date.now()}`,
          role: 'assistant',
          name: 'PandaAI',
          content: '收到，我先解析因子配置和日志，然后给你建议。'
        }
      ]);
      setChatGenerating(false);
    }, 600);
  }, []);

  return (
    <div className="workspace-shell">
      <div className="factor-container">
        <Space vertical align="start" spacing="tight">
          <Space align="center" spacing="medium">
            <Tooltip content="返回列表">
              <span className="tooltip-trigger">
                <Button type="tertiary" icon={<IconArrowLeft />} onClick={() => navigate('/')} />
              </span>
            </Tooltip>
            <Title heading={3}>{factor.name}</Title>
            <Tag color={factorStatus.color} type="solid">
              {factorStatus.label}
            </Tag>
          </Space>
          <Text type="tertiary">{factor.describe}</Text>
          <Divider />
        </Space>

        <div className="workspace-body">
          <div className="workspace-grid">
            <Card className="workspace-card workspace-config" title="因子配置">
              <Form
                layout="vertical"
                initValues={params}
                className="workspace-form"
                labelPosition="left"
                labelAlign="right"
                labelWidth="80px"
              >
                <Form.DatePicker
                  field="date_range"
                  label="回测区间"
                  type="dateRange"
                  style={{ width: 250 }}
                />
                <Form.Select
                  field="adjustment_cycle"
                  label="调仓周期"
                  optionList={[
                    { label: '1天', value: 1 },
                    { label: '3天', value: 3 },
                    { label: '5天', value: 5 },
                    { label: '10天', value: 10 },
                    { label: '20天', value: 20 },
                    { label: '30天', value: 30 }
                  ]}
                />
                <Form.Select
                  field="stock_pool"
                  label="股票池"
                  optionList={[
                    { label: '沪深300', value: '沪深300' },
                    { label: '中证500', value: '中证500' },
                    { label: '中证1000', value: '中证1000' },
                    { label: '全A股', value: '全A股' }
                  ]}
                />
                <Form.RadioGroup field="factor_direction" label='因子方向'>
                  <Form.Radio value={true}>正向</Form.Radio>
                  <Form.Radio value={false}>负向</Form.Radio>
                </Form.RadioGroup>

                <Form.Slider field="group_number" label="分组数量" min={2} max={20} />
                <Form.Switch field="include_st" label="包含ST" />
                <Form.Select
                  field="extreme_value_processing"
                  label="极值处理"
                  optionList={[
                    { label: '标准差', value: '标准差' },
                    { label: '中位数', value: '中位数' }
                  ]}
                />
              </Form>
            </Card>

            <Card className="workspace-card workspace-code">
              <div className="workspace-card-header">
                <Text strong>Python 模块</Text>
                <Space spacing="tight" className="workspace-card-actions">
                  <Button theme="solid" type="primary">
                    保存
                  </Button>
                  <Button icon={<IconPlayCircle />} loading={loadingRun} onClick={handleRun}>
                    运行
                  </Button>
                </Space>
              </div>
              <MonacoEditor
                height={`${minEditorHeight}px`}
                defaultLanguage="python"
                value={factor.code}
                className="workspace-editor"
                onChange={(value) => setFactor((prev) => ({ ...prev, code: value ?? '' }))}
                options={{
                  minimap: { enabled: false },
                  fontSize: 13,
                  lineHeight: editorLineHeight,
                  scrollBeyondLastLine: false
                }}
              />
              <div
                className={`workspace-console ${
                  isConsoleCollapsed ? 'workspace-console-collapsed' : ''
                }`}
              >
                <div className="workspace-console-header">
                  <Text strong>Console</Text>
                  <Space spacing="tight">
                    <Text type="tertiary">
                      {taskStatus?.last_log_message || taskStatus?.result || '暂无日志'}
                    </Text>
                    {/* <IconShrinkScreenStroked /> */}
                    <Button
                      type="tertiary"
                      className="workspace-console-toggle"
                      icon={isConsoleCollapsed ? <IconFullScreenStroked />: <IconShrinkScreenStroked />}
                      onClick={() => setIsConsoleCollapsed((prev) => !prev)}
                    />
                  </Space>
                </div>
                <div className="workspace-console-body">
                  {consoleLogs.length === 0 ? (
                    <Text type="tertiary">暂无日志</Text>
                  ) : (
                    consoleLogs.map((log, index) => (
                      <div key={`${log.time}-${index}`} className="workspace-console-line">
                        <Text type="tertiary" className="workspace-console-time">
                          [{log.time}]
                        </Text>
                        <Tag size="small" color={log.level === 'ERROR' ? 'red' : 'blue'}>
                          {log.level}
                        </Tag>
                        <Text>{log.message}</Text>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </Card>

          </div>
        </div>
      </div>
      <aside className="ai-container">
        <Card className="workspace-card workspace-ai" title="AI 助手">
          <AIChatDialogue
            className="workspace-ai-dialogue"
            roleConfig={chatRoleConfig}
            align="leftRight"
            mode="bubble"
            chats={chatMessages}
            onChatsChange={setChatMessages}
          />
          <AIChatInput
            className="workspace-ai-input"
            placeholder="描述你的问题或需求..."
            generating={chatGenerating}
            onMessageSend={onChatSend}
            onStopGenerate={() => setChatGenerating(false)}
          />
        </Card>
      </aside>
    </div>
  );
}
