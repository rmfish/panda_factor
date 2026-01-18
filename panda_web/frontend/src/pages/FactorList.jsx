import { useEffect, useMemo, useState } from 'react';
import { Card, Button, Space, Tag, Typography } from '@douyinfe/semi-ui';
import { Link } from 'react-router-dom';
import { getUserFactorList } from '../api/factorService.js';

const { Title, Paragraph, Text } = Typography;

const fallbackFactors = [
  {
    factor_id: 'alpha-001',
    factor_name: 'Alpha Momentum',
    name: '动量因子',
    return_ratio: '27.62%',
    sharpe_ratio: 1.61,
    maximum_drawdown: '6.16%',
    annualized_ratio: '29.05%',
    IC: 0.059,
    IR: 0.31,
    updated_at: '2024-09-18'
  },
  {
    factor_id: 'beta-017',
    factor_name: 'Beta Volatility',
    name: '波动因子',
    return_ratio: '18.25%',
    sharpe_ratio: 1.12,
    maximum_drawdown: '8.05%',
    annualized_ratio: '21.40%',
    IC: 0.032,
    IR: 0.18,
    updated_at: '2024-09-10'
  }
];

export default function FactorList() {
  const [factors, setFactors] = useState(fallbackFactors);

  useEffect(() => {
    const fetchList = async () => {
      const response = await getUserFactorList({
        user_id: 'demo-user',
        page: 1,
        page_size: 6,
        sort_field: 'updated_at',
        sort_order: 'desc'
      });
      if (response.ok && response.data?.data?.data) {
        setFactors(response.data.data.data);
      }
    };
    fetchList();
  }, []);

  const renderedFactors = useMemo(() => factors.slice(0, 6), [factors]);

  return (
    <div className="page-shell">
      <Space vertical align="start" spacing="loose" className="page-hero">
        <Title heading={3}>因子列表</Title>
        <Paragraph type="tertiary">
          结合服务端因子列表接口展示最新更新的因子概览，并进入工作台继续编辑与运行。
        </Paragraph>
      </Space>
      <div className="card-grid">
        {renderedFactors.map((factor) => {
          const factorId = factor.factor_id || factor.id;
          return (
            <Card key={factorId} className="factor-card" shadow="hover">
            <Space vertical align="start" spacing="tight">
              <Space align="center">
                <Title heading={5}>{factor.factor_name || factor.name}</Title>
                <Tag color="blue" type="solid">
                  {factor.name || '自定义'}
                </Tag>
              </Space>
              <Text type="tertiary">最近更新：{factor.updated_at}</Text>
              <Space spacing="tight" className="factor-metrics">
                <Text type="tertiary">年化：{factor.annualized_ratio}</Text>
                <Text type="tertiary">回撤：{factor.maximum_drawdown}</Text>
                <Text type="tertiary">IC：{factor.IC}</Text>
              </Space>
              <Space spacing="tight">
                <Button theme="solid" type="primary">
                  <Link to={`/workspace/${factorId}`} className="link-button">
                    进入工作台
                  </Link>
                </Button>
                <Button theme="borderless" type="primary">
                  <Link to={`/detail/${factorId}`} className="link-button">
                    查看详情
                  </Link>
                </Button>
              </Space>
            </Space>
          </Card>
          );
        })}
      </div>
    </div>
  );
}
