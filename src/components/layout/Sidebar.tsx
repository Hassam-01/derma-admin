import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, ShoppingCart, Users, FolderTree,
  FlaskConical, Tag, MapPin, Megaphone, Settings, TrendingUp,
  LogOut, UserCheck, Activity, Image,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Role } from '../../types/auth';

interface NavItem {
  to: string;
  icon: React.ReactNode;
  label: string;
}

interface NavSection {
  label?: string;
  items: NavItem[];
}

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const isVendor = user?.role === Role.VENDOR;
  const base     = isVendor ? '/vendor' : '/executive';

  const handleLogout = () => { logout(); navigate('/login'); };

  const sections: NavSection[] = isVendor
    ? [
        {
          label: 'Overview',
          items: [
            { to: `${base}/dashboard`, icon: <LayoutDashboard size={16} />, label: 'Dashboard' },
            { to: `${base}/orders`,    icon: <ShoppingCart size={16} />,    label: 'Orders' },
          ],
        },
        {
          label: 'Catalog',
          items: [
            { to: `${base}/products`,  icon: <Package size={16} />,  label: 'Products' },
            { to: `${base}/coupons`,   icon: <Tag size={16} />,      label: 'Coupons' },
          ],
        },
        {
          label: 'Insights',
          items: [
            { to: `${base}/customers`, icon: <Users size={16} />,  label: 'Customers' },
            { to: `${base}/locations`, icon: <MapPin size={16} />, label: 'Locations' },
          ],
        },
      ]
    : [
        {
          label: 'Overview',
          items: [
            { to: `${base}/dashboard`,   icon: <LayoutDashboard size={16} />, label: 'Dashboard' },
            { to: `${base}/orders`,      icon: <ShoppingCart size={16} />,    label: 'Orders' },
            { to: `${base}/leaderboard`, icon: <TrendingUp size={16} />,      label: 'Leaderboard' },
          ],
        },
        {
          label: 'Catalog',
          items: [
            { to: `${base}/products`,    icon: <Package size={16} />,      label: 'Products' },
            { to: `${base}/categories`,  icon: <FolderTree size={16} />,   label: 'Categories' },
            { to: `${base}/ingredients`, icon: <FlaskConical size={16} />, label: 'Ingredients' },
            { to: `${base}/coupons`,     icon: <Tag size={16} />,          label: 'Coupons' },
          ],
        },
        {
          label: 'Insights',
          items: [
            { to: `${base}/customers`,   icon: <Users size={16} />,        label: 'Customers' },
            { to: `${base}/locations`,   icon: <MapPin size={16} />,       label: 'Locations' },
            { to: `${base}/scans`,       icon: <Image size={16} />,        label: 'Scans' },
          ],
        },
        {
          label: 'Admin',
          items: [
            { to: `${base}/users`,         icon: <UserCheck size={16} />,  label: 'Users' },
            { to: `${base}/announcements`, icon: <Megaphone size={16} />,  label: 'Announcements' },
            { to: `${base}/settings`,      icon: <Settings size={16} />,   label: 'Settings' },
          ],
        },
        {
          label: 'System',
          items: [
            { to: `${base}/system-health`, icon: <Activity size={16} />,   label: 'System Health' },
          ],
        },
      ];

  const initials = user?.email ? user.email.slice(0, 2).toUpperCase() : '??';

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-name">DermaLens</div>
        <div className="sidebar-logo-role">{isVendor ? 'Vendor Portal' : 'Executive Portal'}</div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {sections.map((section, si) => (
          <div key={si}>
            {section.label && (
              <div className="sidebar-section-label">{section.label}</div>
            )}
            {section.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              >
                {item.icon}
                {item.label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">{initials}</div>
          <div style={{ minWidth: 0 }}>
            <div className="sidebar-user-name">{user?.email}</div>
            <div className="sidebar-user-role">{user?.role}</div>
          </div>
        </div>
        <button className="nav-link" onClick={handleLogout} style={{ gap: 8 }}>
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </aside>
  );
};
