import React, { useState, useEffect } from 'react';
import { Table, Button, DatePicker, Tabs, Tag, Modal, Form, InputNumber, TimePicker, message, Layout, Menu } from 'antd';
import { PlusOutlined, LogoutOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import {
  getSlots, createSlot, deleteSlot,
  getAdminReservations, adminCancel, adminCheckIn,
} from '../services/api';
import { useAuth } from '../hooks/useAuth';
import dayjs from 'dayjs';

const { Header, Content } = Layout;

const statusMap = {
  pending: { color: 'blue', text: '待签到' },
  checked_in: { color: 'green', text: '已签到' },
  cancelled: { color: 'default', text: '已取消' },
  expired: { color: 'red', text: '已过期' },
};

export default function AdminPage() {
  const [slots, setSlots] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const fetchSlots = async (date) => {
    setLoading(true);
    try {
      const res = await getSlots({ date: date || dayjs().format('YYYY-MM-DD') });
      setSlots(res.data || []);
    } catch { message.error('加载时段失败'); } finally { setLoading(false); }
  };

  const fetchReservations = async (date) => {
    setLoading(true);
    try {
      const res = await getAdminReservations({ date: date || dayjs().format('YYYY-MM-DD') });
      setReservations(res.data?.list || []);
    } catch { message.error('加载预约失败'); } finally { setLoading(false); }
  };

  useEffect(() => { fetchSlots(); fetchReservations(); }, []);

  const handleCreateSlot = async () => {
    try {
      const values = await form.validateFields();
      await createSlot({
        date: values.date.format('YYYY-MM-DD'),
        start_time: values.time[0].format('HH:mm'),
        end_time: values.time[1].format('HH:mm'),
        capacity: values.capacity,
      });
      message.success('时段创建成功');
      setModalOpen(false);
      form.resetFields();
      fetchSlots();
    } catch (err) {
      if (err?.message) message.error(err.message);
    }
  };

  const handleDeleteSlot = async (id) => {
    try {
      await deleteSlot(id);
      message.success('删除成功');
      fetchSlots();
    } catch (err) { message.error(err?.message || '删除失败'); }
  };

  const slotColumns = [
    { title: '日期', dataIndex: 'date' },
    { title: '时间段', render: (_, r) => `${r.start_time} - ${r.end_time}` },
    { title: '容量', render: (_, r) => `${r.reserved}/${r.capacity}` },
    {
      title: '操作',
      render: (_, r) => (
        <Button danger size="small" disabled={r.reserved > 0} onClick={() => handleDeleteSlot(r.id)}>删除</Button>
      ),
    },
  ];

  const resColumns = [
    { title: '用户', render: (_, r) => r.real_name || r.username },
    { title: '日期', dataIndex: 'date' },
    { title: '时间段', render: (_, r) => `${r.start_time} - ${r.end_time}` },
    { title: '状态', dataIndex: 'status', render: (s) => <Tag color={statusMap[s]?.color}>{statusMap[s]?.text || s}</Tag> },
    {
      title: '操作',
      render: (_, r) => (
        <>
          {r.status === 'pending' && (
            <>
              <Button type="primary" size="small" onClick={() => adminCheckIn(r.id).then(() => fetchReservations())} style={{ marginRight: 8 }}>核销</Button>
              <Button size="small" danger onClick={() => adminCancel(r.id).then(() => fetchReservations())}>取消</Button>
            </>
          )}
        </>
      ),
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>管理后台</div>
        <span style={{ color: '#fff', marginLeft: 'auto', marginRight: 16 }}>{user?.real_name || user?.username}</span>
        <Button type="text" icon={<LogoutOutlined />} style={{ color: '#fff' }} onClick={() => { logout(); navigate('/login'); }}>退出</Button>
      </Header>
      <Content style={{ padding: 24 }}>
        <Tabs defaultActiveKey="slots" items={[
          {
            key: 'slots',
            label: '时段管理',
            children: (
              <>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)} style={{ marginBottom: 16 }}>
                  创建时段
                </Button>
                <DatePicker onChange={(d) => fetchSlots(d?.format('YYYY-MM-DD'))} style={{ marginLeft: 16 }} />
                <Table rowKey="id" columns={slotColumns} dataSource={slots} loading={loading} />
              </>
            ),
          },
          {
            key: 'reservations',
            label: '预约管理',
            children: (
              <>
                <DatePicker onChange={(d) => fetchReservations(d?.format('YYYY-MM-DD'))} style={{ marginBottom: 16 }} />
                <Table rowKey="id" columns={resColumns} dataSource={reservations} loading={loading} />
              </>
            ),
          },
        ]} />

        <Modal title="创建时段" open={modalOpen} onOk={handleCreateSlot} onCancel={() => setModalOpen(false)}>
          <Form form={form} layout="vertical">
            <Form.Item name="date" label="日期" rules={[{ required: true }]}>
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="time" label="时间段" rules={[{ required: true }]}>
              <TimePicker.RangePicker format="HH:mm" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="capacity" label="容量" rules={[{ required: true }]}>
              <InputNumber min={1} style={{ width: '100%' }} />
            </Form.Item>
          </Form>
        </Modal>
      </Content>
    </Layout>
  );
}
