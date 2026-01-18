import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Card,
  Button,
  Descriptions,
  Space,
  Tag,
  Typography
} from '@douyinfe/semi-ui';

const { Title, Paragraph, Text } = Typography;

const factorMap = {
  'alpha-001': {
    name: 'Alpha Momentum',
    owner: '策略组',
    status: '已上线',
    updatedAt: '2024-09-18',
    summary: '关注中长期动量信号，提供稳定的择时能力。'
  },
  'beta-017': {
    name: 'Beta Volatility',
    owner: '风控组',
    status: '调试中',
    updatedAt: '2024-09-10',
    summary: '对波动率异常进行预警，辅助风险控制。'
  },
  'gamma-032': {
    name: 'Gamma Liquidity',
    owner: '研究组',
    status: '规划中',
    updatedAt: '2024-09-02',
    summary: '衡量流动性衰减趋势，用于交易执行优化。'
  }
};

export default function FactorDetail() {
  const { factorId } = useParams();
  const detail = useMemo(
    () => factorMap[factorId] || factorMap['alpha-001'],
    [factorId]
  );

  const descriptionData = [
    { key: '负责人', value: detail.owner },
    { key: '状态', value: <Tag color="green">{detail.status}</Tag> },
    { key: '最近更新', value: detail.updatedAt },
    { key: '因子编号', value: factorId }
  ];

  return (
    <div className="page-shell">
      <Space vertical align="start" spacing="loose" className="page-hero">
        <Space align="center">
          <Title heading={3}>{detail.name}</Title>
          <Tag color="green" type="solid">
            {detail.status}
          </Tag>
        </Space>
        <Paragraph type="tertiary">{detail.summary}</Paragraph>
      </Space>
      <Card className="detail-card" shadow="hover">
        <Descriptions data={descriptionData} column={2} row />
        <Paragraph type="tertiary" className="detail-footer">
          如需编辑配置，请联系相关负责人或在后续版本中补充表单。
        </Paragraph>
        <Button theme="solid" type="primary">
          <Link to="/" className="link-button">
            返回列表
          </Link>
        </Button>
      </Card>
    </div>
  );
}
