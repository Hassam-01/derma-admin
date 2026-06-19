import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LogOut, LayoutDashboard, Package, TrendingUp, Users, MapPin, Tag, ShoppingCart, FolderTree, FlaskConical, Settings } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Role } from '../../types/auth';

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isVendor = user?.role === Role.VENDOR;
  const isExec = user?.role === Role.EXECUTIVE;
  
  const basePath = isVendor ? '/vendor' : '/executive';

  return (
    <aside style={{ width: '260px', background: 'var(--bg-surface)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '2rem', borderBottom: '1px solid var(--border)' }}>
        <h2 className="text-gradient">DermaLens</h2>
        <p style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>{isVendor ? 'Vendor Portal' : 'Executive Portal'}</p>
      </div>

      <nav style={{ flex: 1, padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', overflowY: 'auto' }}>
        <NavLink 
          to={`${basePath}/dashboard`} 
          className={({isActive}) => `btn ${isActive ? 'btn-primary' : 'btn-secondary'}`} 
          style={{ justifyContent: 'flex-start', border: 'none', background: 'transparent' }}
        >
          <LayoutDashboard size={20} /> Dashboard
        </NavLink>
        
        {isExec && (
          <NavLink 
            to={`${basePath}/leaderboard`} 
            className={({isActive}) => `btn ${isActive ? 'btn-primary' : 'btn-secondary'}`} 
            style={{ justifyContent: 'flex-start', border: 'none', background: 'transparent' }}
          >
            <TrendingUp size={20} /> Leaderboard
          </NavLink>
        )}

        {isExec && (
          <NavLink 
            to={`${basePath}/users`} 
            className={({isActive}) => `btn ${isActive ? 'btn-primary' : 'btn-secondary'}`} 
            style={{ justifyContent: 'flex-start', border: 'none', background: 'transparent' }}
          >
            <Users size={20} /> Users
          </NavLink>
        )}

        <NavLink 
          to={`${basePath}/orders`} 
          className={({isActive}) => `btn ${isActive ? 'btn-primary' : 'btn-secondary'}`} 
          style={{ justifyContent: 'flex-start', border: 'none', background: 'transparent' }}
        >
          <ShoppingCart size={20} /> Orders
        </NavLink>

        <NavLink 
          to={`${basePath}/products`} 
          className={({isActive}) => `btn ${isActive ? 'btn-primary' : 'btn-secondary'}`} 
          style={{ justifyContent: 'flex-start', border: 'none', background: 'transparent' }}
        >
          <Package size={20} /> Products
        </NavLink>

        {isExec && (
          <>
            <NavLink 
              to={`${basePath}/categories`} 
              className={({isActive}) => `btn ${isActive ? 'btn-primary' : 'btn-secondary'}`} 
              style={{ justifyContent: 'flex-start', border: 'none', background: 'transparent' }}
            >
              <FolderTree size={20} /> Categories
            </NavLink>
            <NavLink 
              to={`${basePath}/ingredients`} 
              className={({isActive}) => `btn ${isActive ? 'btn-primary' : 'btn-secondary'}`} 
              style={{ justifyContent: 'flex-start', border: 'none', background: 'transparent' }}
            >
              <FlaskConical size={20} /> Ingredients
            </NavLink>
          </>
        )}

        <NavLink 
          to={`${basePath}/customers`} 
          className={({isActive}) => `btn ${isActive ? 'btn-primary' : 'btn-secondary'}`} 
          style={{ justifyContent: 'flex-start', border: 'none', background: 'transparent' }}
        >
          <Users size={20} /> Customers
        </NavLink>

        <NavLink 
          to={`${basePath}/locations`} 
          className={({isActive}) => `btn ${isActive ? 'btn-primary' : 'btn-secondary'}`} 
          style={{ justifyContent: 'flex-start', border: 'none', background: 'transparent' }}
        >
          <MapPin size={20} /> Locations
        </NavLink>

        <NavLink 
          to={`${basePath}/coupons`} 
          className={({isActive}) => `btn ${isActive ? 'btn-primary' : 'btn-secondary'}`} 
          style={{ justifyContent: 'flex-start', border: 'none', background: 'transparent' }}
        >
          <Tag size={20} /> Coupons
        </NavLink>

        {isExec && (
          <NavLink 
            to={`${basePath}/settings`} 
            className={({isActive}) => `btn ${isActive ? 'btn-primary' : 'btn-secondary'}`} 
            style={{ justifyContent: 'flex-start', border: 'none', background: 'transparent' }}
          >
            <Settings size={20} /> Settings
          </NavLink>
        )}
      </nav>

      <div style={{ padding: '1.5rem 1rem', borderTop: '1px solid var(--border)' }}>
        <div style={{ marginBottom: '1rem', padding: '0 0.5rem' }}>
          <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{user?.name || user?.email}</div>
          <div className="badge badge-primary" style={{ marginTop: '0.25rem' }}>{user?.role}</div>
        </div>
        <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'flex-start', border: 'none' }} onClick={handleLogout}>
          <LogOut size={20} /> Sign Out
        </button>
      </div>
    </aside>
  );
};
