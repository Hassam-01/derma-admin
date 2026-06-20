import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export const DashboardLayout: React.FC = () => {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-wrap">
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
