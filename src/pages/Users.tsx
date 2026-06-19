import React, { useEffect, useState } from 'react';
import { Users as UsersIcon, Shield, CheckCircle, XCircle } from 'lucide-react';
import { api } from '../lib/api';

export const Users: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users');
      setUsers(res.data.data?.data || res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch users', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleStatusChange = async (userId: string, currentStatus: boolean) => {
    try {
      await api.put(`/users/${userId}/change-status`, { isActive: !currentStatus });
      fetchUsers();
    } catch (err) {
      console.error('Failed to change user status', err);
      alert('Failed to update status');
    }
  };

  const handleRoleChange = async (userId: string, e: React.ChangeEvent<HTMLSelectElement>) => {
    try {
      await api.put(`/users/${userId}/change-role`, { role: e.target.value });
      fetchUsers();
    } catch (err) {
      console.error('Failed to change user role', err);
      alert('Failed to update role');
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="flex-between">
        <div>
          <h2>Users Management</h2>
          <p className="text-muted mt-md">Manage system users, roles, and status.</p>
        </div>
      </div>

      <div className="glass-panel">
        {loading ? (
          <div className="flex-center text-muted" style={{ padding: '3rem' }}>Loading users...</div>
        ) : users.length > 0 ? (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u: any) => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{u.firstName} {u.lastName}</div>
                    </td>
                    <td>{u.email}</td>
                    <td>
                      <select 
                        className="form-control" 
                        style={{ padding: '0.25rem 0.5rem', height: 'auto', fontSize: '0.875rem', width: 'auto' }}
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e)}
                      >
                        <option value="CUSTOMER">Customer</option>
                        <option value="VENDOR">Vendor</option>
                        <option value="EXECUTIVE">Executive</option>
                      </select>
                    </td>
                    <td>
                      <span className={`badge ${u.isActive ? 'badge-success' : 'badge-danger'}`}>
                        {u.isActive ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button 
                        className={`btn ${u.isActive ? 'btn-danger' : 'btn-primary'} btn-sm`}
                        onClick={() => handleStatusChange(u.id, u.isActive)}
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                      >
                        {u.isActive ? 'Suspend' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex-center text-muted" style={{ padding: '3rem', flexDirection: 'column', gap: '1rem' }}>
            <UsersIcon size={48} opacity={0.5} />
            <p>No users found.</p>
          </div>
        )}
      </div>
    </div>
  );
};
