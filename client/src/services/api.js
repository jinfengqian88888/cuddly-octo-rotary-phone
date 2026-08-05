import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  timeout: 10000,
});

// Request interceptor — attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — handle 401
api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    if (err.response?.data?.code === 1002) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err.response?.data || err);
  }
);

// Auth
export const login = (data) => api.post('/auth/login', data);
export const register = (data) => api.post('/auth/register', data);

// Slots
export const getSlots = (params) => api.get('/slots', { params });
export const createSlot = (data) => api.post('/slots', data);
export const batchCreateSlots = (data) => api.post('/slots/batch', data);
export const updateSlot = (id, data) => api.put(`/slots/${id}`, data);
export const deleteSlot = (id) => api.delete(`/slots/${id}`);

// Reservations
export const getReservations = (params) => api.get('/reservations', { params });
export const createReservation = (data) => api.post('/reservations', data);
export const cancelReservation = (id) => api.delete(`/reservations/${id}`);

// Check-in
export const checkIn = (id) => api.post(`/check-in/${id}`);

// Admin
export const getAdminReservations = (params) => api.get('/admin/reservations', { params });
export const adminCancel = (id) => api.post(`/admin/reservations/${id}/cancel`);
export const adminCheckIn = (id) => api.post(`/admin/reservations/${id}/check-in`);
