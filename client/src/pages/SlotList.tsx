import React, { useState, useEffect } from 'react';
import { Table, Button, DatePicker, message, Layout, Menu, Tag } from 'antd';
import { CalendarOutlined, HistoryOutlined, LogoutOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getSlots, createReservation } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import dayjs from 'dayjs';

const { Header, Content } = Layout;

export default function SlotListPage() {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState(null);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const fetchSlots = async (date) => {
    setLoading(true);
    try {
      const res = await getSlots({ date: date || dayjs().format('YYYY-MM-DD') });
      setSlots(res.data || []);
    } catch (err) {
      message.error('加载时段失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSlots(); }, []);

  const handleBook = async (slotId) => {
    setBooking(slotId);
    try {
      await createReservation({ slot_id: slotId });
      message.success('预约成功');
      fetchSlots();
    } catch (err) {
      message.error(err?.message || '预约失败');
    } finally {
      setBooking(null);
    }
  };

  const columns = [
    { title: '日期', dataIndex: 'date', key: 'date' },
    { title: '时间段', key: 'time', render: (_, r) => `${r.start_time} - ${r.end_time}` },
    { title: '名额', key: 'capacity', render: (_, r) => `${r.reserved}/${r.capacity}` },
    {
      title: '状态',
      key: 'status',
      render: (_, r) => {
        const available = r.reserved < r.capacity;
        return <Tag color={available ? 'green' : 'red'}>{available ? '可预约' : '已满'}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_, r) => (
        <Button
          type="primary"
          disabled={r.reserved >= r.capacity}
          loading={booking === r.id}
          onClick={() => handleBook(r.id)}
        >
          预约
        </Button>
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
        <DatePicker onChange={(d) => fetchSlots(d?.format('YYYY-MM-DD'))} style={{ marginBottom: 16 }} />
        <Table rowKey="id" columns={columns} dataSource={slots} loading={loading} />
      </Content>
    </Layout>
  );
}
