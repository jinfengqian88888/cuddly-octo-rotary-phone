import React, { useState, useEffect } from 'react';
import { Table, Button, Tag, message, Layout, Menu } from 'antd';
import { CalendarOutlined, HistoryOutlined, LogoutOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getReservations, cancelReservation, checkIn } from '../services/api';
import { useAuth } from '../hooks/useAuth';

const { Header, Content } = Layout;

const statusMap = {
  pending: { color: 'blue', text: '待签到' },
  checked_in: { color: 'green', text: '已签到' },
  cancelled: { color: 'default', text: '已取消' },
  expired: { color: 'red', text: '已过期' },
};

export default function MyReservationsPage() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const fetchReservations = async () => {
    setLoading(true);
    try {
      const res = await getReservations();
      setReservations(res.data || []);
    } catch {
      message.error('加载预约失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReservations(); }, []);

  const handleCancel = async (id) => {
    try {
      await cancelReservation(id);
      message.success('取消成功');
      fetchReservations();
    } catch (err) {
      message.error(err?.message || '取消失败');
    }
  };

  const handleCheckIn = async (id) => {
    try {
      await checkIn(id);
      message.success('签到成功');
      fetchReservations();
    } catch (err) {
      message.error(err?.message || '签到失败');
    }
  };

  const columns = [
    { title: '日期', dataIndex: 'date', key: 'date' },
    { title: '时间段', key: 'time', render: (_, r) => `${r.start_time} - ${r.end_time}` },
    { title: '状态', dataIndex: 'status', key: 'status', render: (s) => <Tag color={statusMap[s]?.color}>{statusMap[s]?.text || s}</Tag> },
    {
      title: '操作',
      key: 'action',
      render: (_, r) => (
        <>
          {r.status === 'pending' && (
            <>
              <Button type="primary" size="small" onClick={() => handleCheckIn(r.id)} style={{ marginRight: 8 }}>签到</Button>
              <Button size="small" danger onClick={() => handleCancel(r.id)}>取消</Button>
            </>
          )}
        </>
      ),
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>体锻室预约系统</div>
        <Menu theme="dark" mode="horizontal" selectable={false} style={{ flex: 1, marginLeft: 24 }}
          items={[
            { key: 'slots', icon: <CalendarOutlined />, label: '可预约时段', onClick: () => navigate('/slots') },
            { key: 'my', icon: <HistoryOutlined />, label: '我的预约', onClick: () => navigate('/reservations') },
          ]}
        />
        <span style={{ color: '#fff', marginRight: 16 }}>{user?.real_name || user?.username}</span>
        <Button type="text" icon={<LogoutOutlined />} style={{ color: '#fff' }} onClick={() => { logout(); navigate('/login'); }}>
          退出
        </Button>
      </Header>
      <Content style={{ padding: 24 }}>
        <h2>我的预约</h2>
        <Table rowKey="id" columns={columns} dataSource={reservations} loading={loading} />
      </Content>
    </Layout>
  );
}
