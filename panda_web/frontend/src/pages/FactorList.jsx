import { useEffect, useState, useMemo } from 'react';
import {
  Table,
  Button,
  Space,
  Typography,
  Modal,
  Form,
  Input,
  Toast,
  Popconfirm,
} from '@douyinfe/semi-ui-19';
import { useNavigate } from 'react-router-dom';
import { getUserFactorList, deleteFactor, queryFactor, updateFactor } from '../utils/api';

const { Title, Text } = Typography;

function formatDate(dt) {
  if (!dt) return '-';
  try {
    return new Date(dt).toLocaleString();
  } catch {
    return dt;
  }
}

export default function FactorList() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(7);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [sortField, setSortField] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  const [editVisible, setEditVisible] = useState(false);
  const [editingFactor, setEditingFactor] = useState(null);
  const [editFormValues, setEditFormValues] = useState({ name: '' });

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await getUserFactorList({
        user_id: '0',
        page,
        page_size: pageSize,
        sort_field: sortField,
        sort_order: sortOrder,
      });
      const list = res?.data || [];
      setData(list);
      setTotal(res?.total || 0);
    } catch (e) {
      Toast.error(`获取列表失败：${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, sortField, sortOrder]);

  const onDelete = async (record) => {
    try {
      await deleteFactor(record.factor_id);
      Toast.success('删除成功');
      fetchList();
    } catch (e) {
      Toast.error(`删除失败：${e.message}`);
    }
  };

  const openEdit = async (record) => {
    try {
      const detail = await queryFactor(record.factor_id);
      setEditingFactor({ id: record.factor_id, detail });
      setEditFormValues({ name: detail?.name || '' });
      setEditVisible(true);
    } catch (e) {
      Toast.error(`获取详情失败：${e.message}`);
    }
  };

  const submitEdit = async () => {
    if (!editingFactor) return;
    try {
      const body = { ...editingFactor.detail, name: editFormValues.name };
      await updateFactor(editingFactor.id, body);
      Toast.success('更新成功');
      setEditVisible(false);
      setEditingFactor(null);
      fetchList();
    } catch (e) {
      Toast.error(`更新失败：${e.message}`);
    }
  };

  const columns = useMemo(
    () => [
      {
        title: '因子名称',
        dataIndex: 'name',
        sorter: true,
        render: (name, record) => (
          <Space>
            <Button type="tertiary" onClick={() => navigate(`/detail/${record.factor_id}`)}>
              {name || '-'}
            </Button>
            <Text type="tertiary">{record.factor_name}</Text>
          </Space>
        ),
        sortOrder:
          sortField === 'name'
            ? (sortOrder === 'asc' ? 'ascend' : 'descend')
            : false,
      },
      {
        title: '收益率',
        dataIndex: 'return_ratio',
        sorter: true,
        render: (val) => (
          <Text style={{ color: val && val !== '0.0%' ? '#ff4d4f' : 'inherit', fontWeight: 600 }}>
            {val || '-'}
          </Text>
        ),
        sortOrder:
          sortField === 'return_ratio'
            ? (sortOrder === 'asc' ? 'ascend' : 'descend')
            : false,
      },
      {
        title: '夏普比率',
        dataIndex: 'sharpe_ratio',
        sorter: true,
        render: (val) => <Text>{val ?? '-'}</Text>,
        sortOrder:
          sortField === 'sharpe_ratio'
            ? (sortOrder === 'asc' ? 'ascend' : 'descend')
            : false,
      },
      {
        title: '最大回撤',
        dataIndex: 'maximum_drawdown',
        sorter: true,
        render: (val) => <Text>{val ?? '-'}</Text>,
        sortOrder:
          sortField === 'maximum_drawdown'
            ? (sortOrder === 'asc' ? 'ascend' : 'descend')
            : false,
      },
      {
        title: '年化收益率',
        dataIndex: 'annualized_ratio',
        render: (val) => <Text>{val ?? '-'}</Text>,
      },
      {
        title: 'IC',
        dataIndex: 'IC',
        sorter: true,
        render: (val) => <Text>{val ?? '-'}</Text>,
        sortOrder:
          sortField === 'IC'
            ? (sortOrder === 'asc' ? 'ascend' : 'descend')
            : false,
      },
      {
        title: 'IR',
        dataIndex: 'IR',
        sorter: true,
        render: (val) => <Text>{val ?? '-'}</Text>,
        sortOrder:
          sortField === 'IR'
            ? (sortOrder === 'asc' ? 'ascend' : 'descend')
            : false,
      },
      {
        title: '最近回测时间',
        dataIndex: 'updated_at',
        sorter: true,
        render: (val) => <Text type="tertiary">{formatDate(val)}</Text>,
        sortOrder:
          sortField === 'updated_at'
            ? (sortOrder === 'asc' ? 'ascend' : 'descend')
            : false,
      },
      {
        title: '创建时间',
        dataIndex: 'created_at',
        sorter: true,
        render: (val) => <Text type="tertiary">{formatDate(val)}</Text>,
        sortOrder:
          sortField === 'created_at'
            ? (sortOrder === 'asc' ? 'ascend' : 'descend')
            : false,
      },
      {
        title: '操作',
        dataIndex: 'op',
        width: 140,
        render: (_, record) => (
          <Space>
            <Button onClick={() => navigate(`/detail/${record.factor_id}`)}>查看</Button>
            <Button onClick={() => openEdit(record)}>编辑</Button>
            <Popconfirm
              title="确认删除该因子？"
              content="删除后不可恢复"
              onConfirm={() => onDelete(record)}
            >
              <Button type="danger">删除</Button>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sortField, sortOrder],
  );

  const onSort = ({ sortOrder: order, sortField: field }) => {
    if (!field) return;
    setSortField(field);
    setSortOrder(order === 'ascend' ? 'asc' : 'desc');
    setPage(1);
  };

  return (
    <div className="page-shell">
      <Space align="center" style={{ width: '100%', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title heading={4}>我的因子列表</Title>
        <Space>
          <Button onClick={fetchList}>刷新</Button>
        </Space>
      </Space>
      <Table
        loading={loading}
        columns={columns}
        dataSource={data}
        pagination={{
          pageSize,
          currentPage: page,
          total,
          onChange: (cp, ps) => {
            setPage(cp);
            setPageSize(ps);
          },
        }}
        onSort={onSort}
        rowKey="factor_id"
      />

      <Modal
        title="编辑因子"
        visible={editVisible}
        onCancel={() => setEditVisible(false)}
        onOk={submitEdit}
        okText="保存"
      >
        <Form>
          <Form.Input
            field="name"
            label="因子中文名称"
            value={editFormValues.name}
            onChange={(v) => setEditFormValues((s) => ({ ...s, name: v }))}
            style={{ width: '100%' }}
            rules={[{ required: true, message: '请输入名称' }]}
          />
        </Form>
      </Modal>
    </div>
  );
}
