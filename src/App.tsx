import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { RoleRoute } from './components/RoleRoute';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Products } from './pages/Products';
import { Leaderboard } from './pages/Leaderboard';
import { Users } from './pages/Users';
import { Orders } from './pages/Orders';
import { Categories } from './pages/Categories';
import { Ingredients } from './pages/Ingredients';
import { Customers } from './pages/Customers';
import { Locations } from './pages/Locations';
import { Coupons } from './pages/Coupons';
import { Settings } from './pages/Settings';
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
            <Route path="orders" element={<Orders />} />
            <Route path="customers" element={<Customers />} />
            <Route path="locations" element={<Locations />} />
            <Route path="coupons" element={<Coupons />} />
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
            <Route path="users" element={<Users />} />
            <Route path="orders" element={<Orders />} />
            <Route path="categories" element={<Categories />} />
            <Route path="ingredients" element={<Ingredients />} />
            <Route path="customers" element={<Customers />} />
            <Route path="locations" element={<Locations />} />
            <Route path="coupons" element={<Coupons />} />
            <Route path="settings" element={<Settings />} />
            <Route path="*" element={<div>Coming Soon</div>} />
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
