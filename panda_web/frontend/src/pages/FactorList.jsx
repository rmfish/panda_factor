import { Card, Button, Space, Tag, Typography } from '@douyinfe/semi-ui';
import { Link } from 'react-router-dom';

const { Title, Paragraph, Text } = Typography;

const factors = [
  {
    id: 'alpha-001',
    name: 'Alpha Momentum',
    description: '基于价格动量的核心交易因子，适用于多周期回测。',
    status: '已上线'
  },
  {
    id: 'beta-017',
    name: 'Beta Volatility',
    description: '刻画波动结构的风险因子，适配风控指标体系。',
    status: '调试中'
  },
  {
    id: 'gamma-032',
    name: 'Gamma Liquidity',
    description: '监控流动性变化趋势，为交易执行提供决策。',
    status: '规划中'
  }
];

export default function FactorList() {
  return (
    <div className="page-shell">
      <Space vertical align="start" spacing="loose" className="page-hero">
        <Title heading={3}>因子列表</Title>
        <Paragraph type="tertiary">
          统一管理关键因子资产，结合 Semi Design 组件快速搭建业务界面。
        </Paragraph>
      </Space>
      <div className="card-grid">
        {factors.map((factor) => (
          <Card key={factor.id} className="factor-card" shadow="hover">
            <Space vertical align="start" spacing="tight">
              <Space align="center">
                <Title heading={5}>{factor.name}</Title>
                <Tag color="blue" type="solid">
                  {factor.status}
                </Tag>
              </Space>
              <Text type="tertiary">编号：{factor.id}</Text>
              <Paragraph type="tertiary">{factor.description}</Paragraph>
              <Button theme="solid" type="primary">
                <Link to={`/detail/${factor.id}`} className="link-button">
                  查看详情
                </Link>
              </Button>
            </Space>
          </Card>
        ))}
      </div>
    </div>
  );
}
