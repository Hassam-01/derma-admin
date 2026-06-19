import React, { useEffect, useState } from 'react';
import { FlaskConical, Check, X, Info } from 'lucide-react';
import { api } from '../lib/api';

export const Ingredients: React.FC = () => {
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchIngredients = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/ingredients', { params });
      setIngredients(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch ingredients', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIngredients();
  }, [statusFilter]);

  const handleApprove = async (id: string) => {
    // Basic approval with empty metadata for now, can be expanded to a modal
    try {
      await api.patch(`/ingredients/${id}/approve`, {
        aliases: [],
        isComedogenic: false,
        notRecommendedFor: [],
        benefits: []
      });
      fetchIngredients();
    } catch (err) {
      console.error('Failed to approve ingredient', err);
      alert('Failed to approve ingredient');
    }
  };

  const handleReject = async (id: string) => {
    if (!window.confirm('Reject this ingredient request?')) return;
    try {
      await api.patch(`/ingredients/${id}/reject`);
      fetchIngredients();
    } catch (err) {
      console.error('Failed to reject ingredient', err);
      alert('Failed to reject ingredient');
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="flex-between">
        <div>
          <h2>Ingredients Dictionary</h2>
          <p className="text-muted mt-md">Manage the global dictionary of ingredients and vendor requests.</p>
        </div>
      </div>

      <div className="glass-panel">
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
          <div className="form-group" style={{ margin: 0, width: '200px' }}>
            <select className="form-control" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="PENDING">Pending Requests</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex-center text-muted" style={{ padding: '3rem' }}>Loading ingredients...</div>
        ) : ingredients.length > 0 ? (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Comedogenic</th>
                  <th>Added</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {ingredients.map((ing: any) => (
                  <tr key={ing.id}>
                    <td style={{ fontWeight: 500 }}>{ing.name}</td>
                    <td>
                      <span className={`badge ${
                        ing.status === 'APPROVED' ? 'badge-success' : 
                        ing.status === 'REJECTED' ? 'badge-danger' : 'badge-primary'
                      }`}>
                        {ing.status}
                      </span>
                    </td>
                    <td>{ing.isComedogenic ? 'Yes' : 'No'}</td>
                    <td>{new Date(ing.createdAt).toLocaleDateString()}</td>
                    <td>
                      {ing.status === 'PENDING' && (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="btn btn-success btn-sm" onClick={() => handleApprove(ing.id)}>
                            <Check size={16} /> Approve
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleReject(ing.id)}>
                            <X size={16} /> Reject
                          </button>
                        </div>
                      )}
                      {ing.status !== 'PENDING' && (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex-center text-muted" style={{ padding: '3rem', flexDirection: 'column', gap: '1rem' }}>
            <FlaskConical size={48} opacity={0.5} />
            <p>No ingredients found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
};
