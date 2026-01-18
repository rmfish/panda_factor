import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Card,
  Button,
  Descriptions,
  Space,
  Tag,
  Typography
} from '@douyinfe/semi-ui';
import { getFactorDetail } from '../api/factorService.js';

const { Title, Paragraph, Text } = Typography;

const fallbackDetail = {
  factor_name: 'Alpha Momentum',
  name: '动量因子',
  factor_type: 'stock',
  code_type: 'python',
  tags: '动量,趋势',
  describe: '关注中长期动量信号，提供稳定的择时能力。',
  updated_at: '2024-09-18',
  status: 2
};

const statusMap = {
  0: { label: '未运行', color: 'grey' },
  1: { label: '运行中', color: 'blue' },
  2: { label: '运行成功', color: 'green' },
  3: { label: '运行失败', color: 'red' }
};

export default function FactorDetail() {
  const { factorId } = useParams();
  const [detail, setDetail] = useState(fallbackDetail);

  useEffect(() => {
    if (!factorId) return;
    const loadDetail = async () => {
      const response = await getFactorDetail(factorId);
      if (response.ok && response.data?.data) {
        setDetail(response.data.data);
      }
    };
    loadDetail();
  }, [factorId]);

  const status = useMemo(() => statusMap[detail.status] || statusMap[0], [detail.status]);

  const descriptionData = [
    { key: '因子名称', value: detail.factor_name },
    { key: '中文名', value: detail.name },
    { key: '因子类型', value: detail.factor_type },
    { key: '代码类型', value: detail.code_type },
    { key: '标签', value: detail.tags || '-' },
    { key: '更新时间', value: detail.updated_at || '-' }
  ];

  return (
    <div className="page-shell">
      <Space vertical align="start" spacing="loose" className="page-hero">
        <Space align="center">
          <Title heading={3}>{detail.factor_name}</Title>
          <Tag color={status.color} type="solid">
            {status.label}
          </Tag>
        </Space>
        <Paragraph type="tertiary">{detail.describe}</Paragraph>
      </Space>
      <Card className="detail-card" shadow="hover">
        <Descriptions data={descriptionData} column={2} row />
        <Paragraph type="tertiary" className="detail-footer">
          进入因子工作台可以编辑代码、运行管理并查看分析报告。
        </Paragraph>
        <Space spacing="tight">
          <Button theme="solid" type="primary">
            <Link to={`/workspace/${factorId}`} className="link-button">
              打开工作台
            </Link>
          </Button>
          <Button theme="borderless" type="primary">
            <Link to="/" className="link-button">
              返回列表
            </Link>
          </Button>
        </Space>
      </Card>
    </div>
  );
}
