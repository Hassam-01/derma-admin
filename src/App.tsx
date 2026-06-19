import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { RoleRoute } from './components/RoleRoute';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Products } from './pages/Products';
import { Leaderboard } from './pages/Leaderboard';
import { Role } from './types/auth';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          {/* Vendor Routes */}
          <Route path="/vendor" element={
            <RoleRoute allowedRoles={[Role.VENDOR]}>
              <DashboardLayout />
            </RoleRoute>
          }>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="products" element={<Products />} />
            {/* Stubs for other routes */}
            <Route path="*" element={<div>Coming Soon</div>} />
          </Route>

          {/* Executive Routes */}
          <Route path="/executive" element={
            <RoleRoute allowedRoles={[Role.EXECUTIVE]}>
              <DashboardLayout />
            </RoleRoute>
          }>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="products" element={<Products />} />
            <Route path="leaderboard" element={<Leaderboard />} />
            {/* Stubs for other routes */}
            <Route path="*" element={<div>Coming Soon</div>} />
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
