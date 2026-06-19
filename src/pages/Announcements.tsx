import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { Megaphone, Trash2, Power } from 'lucide-react';
import { api } from '../lib/api';

export const Announcements: React.FC = () => {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', body: '' });

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const res = await api.get('/announcement');
      setAnnouncements(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch announcements', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/announcement', newAnnouncement);
      setShowModal(false);
      setNewAnnouncement({ title: '', body: '' });
      fetchAnnouncements();
    } catch (err) {
      console.error('Failed to create announcement', err);
      alert('Failed to create announcement');
    }
  };

  const handleToggle = async (id: string, currentActive: boolean) => {
    try {
      await api.patch(`/announcement/${id}/toggle`, { isActive: !currentActive });
      fetchAnnouncements();
    } catch (err) {
      console.error('Failed to toggle announcement', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      await api.delete(`/announcement/${id}`);
      fetchAnnouncements();
    } catch (err) {
      console.error('Failed to delete announcement', err);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="flex-between">
        <div>
          <h2>Announcements</h2>
          <p className="text-muted mt-md">Manage app-wide announcements for users.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Megaphone size={20} /> Create Announcement
        </button>
      </div>

      <div className="glass-panel">
        {loading ? (
          <div className="flex-center text-muted" style={{ padding: '3rem' }}>Loading announcements...</div>
        ) : announcements.length > 0 ? (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Body</th>
                  <th>Status</th>
                  <th>Created At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {announcements.map((ann) => (
                  <tr key={ann.id}>
                    <td style={{ fontWeight: 500 }}>{ann.title}</td>
                    <td style={{ maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ann.body}</td>
                    <td>
                      <span className={`badge ${ann.isActive ? 'badge-success' : 'badge-secondary'}`}>
                        {ann.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>{new Date(ann.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className={`btn btn-sm ${ann.isActive ? 'btn-secondary' : 'btn-success'}`} onClick={() => handleToggle(ann.id, ann.isActive)}>
                          <Power size={16} /> {ann.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(ann.id)}>
                          <Trash2 size={16} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex-center text-muted" style={{ padding: '3rem', flexDirection: 'column', gap: '1rem' }}>
            <Megaphone size={48} opacity={0.5} />
            <p>No announcements found.</p>
          </div>
        )}
      </div>

      {/* Create Announcement Modal */}
      {showModal && ReactDOM.createPortal(
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ width: '450px' }}>
            <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
              <h3>Create Announcement</h3>
              <button className="btn-icon" onClick={() => setShowModal(false)}>Ã—</button>
            </div>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label>Title</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={newAnnouncement.title} 
                  onChange={e => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Body</label>
                <textarea 
                  className="form-control" 
                  rows={4}
                  value={newAnnouncement.body} 
                  onChange={e => setNewAnnouncement({ ...newAnnouncement, body: e.target.value })} 
                  required 
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
