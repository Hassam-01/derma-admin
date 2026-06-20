import React, { useEffect, useState, useCallback } from 'react';
import { Users as UsersIcon } from 'lucide-react';
import { api } from '../lib/api';

const ROLES = ['CUSTOMER', 'VENDOR', 'EXECUTIVE'];

export const Users: React.FC = () => {
  const [users, setUsers]           = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [roleFilter, setRoleFilter] = useState('');
  const [saving, setSaving]         = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (roleFilter) params.role = roleFilter;
      const res = await api.get('/users', { params });
      const body = res.data.data;
      // GET /users returns { data: User[], total }
      setUsers(Array.isArray(body) ? body : (body?.data ?? []));
    } catch (err) {
      console.error('Failed to fetch users', err);
    } finally {
      setLoading(false);
    }
  }, [roleFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const changeStatus = async (userId: string, isActive: boolean) => {
    setSaving(userId + '-status');
    try {
      await api.put(`/users/${userId}/change-status`, { isActive });
      fetchUsers();
    } catch {
      alert('Failed to update status');
    } finally {
      setSaving(null);
    }
  };

  const changeRole = async (userId: string, role: string) => {
    setSaving(userId + '-role');
    try {
      await api.put(`/users/${userId}/change-role`, { role });
      fetchUsers();
    } catch {
      alert('Failed to update role');
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <div className="page-title">Users</div>
          <div className="page-subtitle">Manage accounts, roles, and status</div>
        </div>
      </div>

      <div className="toolbar">
        <select
          className="form-control"
          style={{ width: 'auto' }}
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="">All Roles</option>
          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div className="loading-row"><div className="spinner" /> Loading users…</div>
        ) : users.length > 0 ? (
          <div className="table-wrap">
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
                    <td style={{ fontWeight: 500 }}>
                      {u.firstName || u.lastName
                        ? `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim()
                        : <span className="text-muted">—</span>}
                    </td>
                    <td className="text-muted">{u.email}</td>
                    <td>
                      <select
                        className="form-control"
                        style={{ width: 'auto', padding: '3px 6px', fontSize: 12 }}
                        value={u.role}
                        disabled={saving === u.id + '-role'}
                        onChange={(e) => changeRole(u.id, e.target.value)}
                      >
                        {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </td>
                    <td>
                      <span className={`badge ${u.isActive ? 'badge-success' : 'badge-danger'}`}>
                        {u.isActive ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="text-muted">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</td>
                    <td>
                      <button
                        className={`btn btn-sm ${u.isActive ? 'btn-danger' : 'btn-primary'}`}
                        disabled={saving === u.id + '-status'}
                        onClick={() => changeStatus(u.id, !u.isActive)}
                      >
                        {saving === u.id + '-status' ? '…' : u.isActive ? 'Suspend' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <UsersIcon size={36} color="var(--text-3)" />
            <p>No users found</p>
          </div>
        )}
      </div>
    </div>
  );
};
