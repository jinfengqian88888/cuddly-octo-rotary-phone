import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/Login';
import SlotListPage from './pages/SlotList';
import MyReservationsPage from './pages/MyReservations';
import AdminPage from './pages/Admin';
import { useAuth } from './hooks/useAuth';

function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/slots" element={user ? <SlotListPage /> : <Navigate to="/login" />} />
      <Route path="/reservations" element={user ? <MyReservationsPage /> : <Navigate to="/login" />} />
      <Route path="/admin" element={user?.role === 'admin' ? <AdminPage /> : <Navigate to="/login" />} />
      <Route path="*" element={<Navigate to="/slots" />} />
    </Routes>
  );
}

export default App;
