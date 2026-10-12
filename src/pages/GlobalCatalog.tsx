import React, { useEffect, useState, useCallback } from 'react';
import ReactDOM from 'react-dom';
import {
  Globe,
  Search,
  Eye,
  CheckCircle2,
  Copy,
  Check,
  X,
  Package,
  Layers,
  RefreshCw,
  ShoppingBag,
} from 'lucide-react';
import { api } from '../lib/api';

interface MatchedConcernItem {
  concern: string;
  score?: number;
  supportType?: string;
  evidenceLevel?: string;
}

interface GlobalProductItem {
  id: string;
  formulationId: string;
  sourceProductId?: string;
  name: string;
  brand: string | null;
  description: string | null;
  imageUrls: string[];
  routineRole: string | null;
  isInternational: boolean;
  origin: 'Pakistani' | 'International';
  matchedConcerns?: MatchedConcernItem[] | null;
  uniqueConcerns: string[];
  ingredientsText: string | null;
  activeClassesList: string[];
  catalogEligibility: string | null;
  exclusionReason: string | null;
  isBundle: boolean;
  inStore: boolean;
  storeStock: number;
  storePrice: number | null;
}

interface CatalogStats {
  total: number;
  pakistani: number;
  international: number;
  withIngredients: number;
  pendingIngredients: number;
  activeCount: number;
  excludedCount: number;
}

const CONCERNS = [
  { id: 'all', label: 'All Concerns' },
  { id: 'acne', label: 'Acne' },
  { id: 'pigmentation', label: 'Pigmentation' },
  { id: 'wrinkles', label: 'Wrinkles' },
  { id: 'skin_redness', label: 'Redness' },
  { id: 'dry_skin', label: 'Dry Skin' },
  { id: 'oily_skin', label: 'Oily Skin' },
  { id: 'blackheads', label: 'Blackheads' },
  { id: 'dark_circles', label: 'Dark Circles' },
];

export const GlobalCatalog: React.FC = () => {
  const [products, setProducts] = useState<GlobalProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<CatalogStats | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [originFilter, setOriginFilter] = useState<'all' | 'pakistani' | 'international'>('all');
  const [concernFilter, setConcernFilter] = useState('all');
  const [ingredientsFilter, setIngredientsFilter] = useState('all');

  // Pagination
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(20);

  // Detail Modal
  const [selectedProduct, setSelectedProduct] = useState<GlobalProductItem | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [copiedIngredients, setCopiedIngredients] = useState(false);

  const fetchCatalog = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {
        page,
        limit,
      };

      if (search.trim()) params.search = search.trim();
      if (originFilter === 'pakistani') params.isInternational = 'false';
      if (originFilter === 'international') params.isInternational = 'true';
      if (concernFilter !== 'all') params.concern = concernFilter;
      if (ingredientsFilter !== 'all') params.hasIngredients = ingredientsFilter;

      const res = await api.get('/global-catalog', { params });
      const data = res.data?.data;

      setProducts(data?.items ?? []);
      setTotal(data?.total ?? 0);
      if (data?.stats) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch global catalog', err);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, originFilter, concernFilter, ingredientsFilter]);

  useEffect(() => {
    fetchCatalog();
  }, [fetchCatalog]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [search, originFilter, concernFilter, ingredientsFilter]);

  const viewDetails = async (item: GlobalProductItem) => {
    try {
      setLoadingDetail(true);
      setSelectedProduct(item);
      const res = await api.get(`/global-catalog/${item.id}`);
      if (res.data?.data) {
        setSelectedProduct(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch product details', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIngredients(true);
    setTimeout(() => setCopiedIngredients(false), 2000);
  };

  const resetFilters = () => {
    setSearch('');
    setOriginFilter('all');
    setConcernFilter('all');
    setIngredientsFilter('all');
    setPage(1);
  };

  const formatConcernLabel = (c: string) => {
    return c
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="fade-in" style={{ paddingBottom: 40 }}>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <div className="flex items-center gap-2">
            <Globe size={22} color="var(--primary)" />
            <div className="page-title">Global Product Catalog</div>
          </div>
          <div className="page-subtitle">
            Scientific skincare knowledge base classified by Pakistani and International brands
          </div>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={fetchCatalog} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
        </button>
      </div>

      {/* KPI Stats Cards */}
      {stats && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 16,
            marginBottom: 20,
          }}
        >
          <div className="card" style={{ padding: '16px 20px', background: 'var(--surface)' }}>
            <div className="text-xs text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Catalog Products
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, marginTop: 4, color: 'var(--text)' }}>
              {stats.total.toLocaleString()}
            </div>
            <div className="text-xs text-muted" style={{ marginTop: 4 }}>
              Active facial catalog: {stats.activeCount.toLocaleString()}
            </div>
          </div>

          <div
            className="card"
            style={{
              padding: '16px 20px',
              background: 'linear-gradient(135deg, rgba(22, 163, 74, 0.05), rgba(22, 163, 74, 0.12))',
              borderColor: 'var(--success-border)',
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ color: 'var(--success)', fontWeight: 600 }}>
                PAKISTANI BRANDS 🇵🇰
              </span>
              <span className="badge badge-success" style={{ fontSize: 10 }}>Domestic</span>
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, marginTop: 4, color: 'var(--success)' }}>
              {stats.pakistani.toLocaleString()}
            </div>
            <div className="text-xs text-muted" style={{ marginTop: 4 }}>
              {((stats.pakistani / stats.total) * 100).toFixed(1)}% of total catalog
            </div>
          </div>

          <div
            className="card"
            style={{
              padding: '16px 20px',
              background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.05), rgba(37, 99, 235, 0.12))',
              borderColor: 'var(--info-border)',
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ color: 'var(--info)', fontWeight: 600 }}>
                INTERNATIONAL BRANDS 🌍
              </span>
              <span className="badge badge-info" style={{ fontSize: 10 }}>Global</span>
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, marginTop: 4, color: 'var(--info)' }}>
              {stats.international.toLocaleString()}
            </div>
            <div className="text-xs text-muted" style={{ marginTop: 4 }}>
              {((stats.international / stats.total) * 100).toFixed(1)}% of total catalog
            </div>
          </div>

          <div className="card" style={{ padding: '16px 20px', background: 'var(--surface)' }}>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Verified Formulations
              </span>
              <CheckCircle2 size={16} color="var(--success)" />
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, marginTop: 4, color: 'var(--text)' }}>
              {stats.withIngredients.toLocaleString()}
            </div>
            <div className="text-xs text-muted" style={{ marginTop: 4 }}>
              {stats.pendingIngredients > 0 ? `${stats.pendingIngredients} in acquisition queue` : '100% complete'}
            </div>
          </div>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="card" style={{ padding: 16, marginBottom: 16 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
          {/* Search Input */}
          <div style={{ flex: '1 1 280px', position: 'relative' }}>
            <Search
              size={15}
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-3)',
              }}
            />
            <input
              className="form-control"
              placeholder="Search by product name, brand, or ingredients…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: 34, height: 38 }}
            />
          </div>

          {/* Origin Filter (Pakistani vs International) */}
          <div style={{ minWidth: 190 }}>
            <select
              className="form-control"
              value={originFilter}
              onChange={(e) => setOriginFilter(e.target.value as any)}
              style={{ height: 38 }}
            >
              <option value="all">🌐 All Brands (Global & Local)</option>
              <option value="pakistani">🇵🇰 Pakistani Brands</option>
              <option value="international">🌍 International Brands</option>
            </select>
          </div>

          {/* Concern Filter */}
          <div style={{ minWidth: 160 }}>
            <select
              className="form-control"
              value={concernFilter}
              onChange={(e) => setConcernFilter(e.target.value)}
              style={{ height: 38 }}
            >
              {CONCERNS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Ingredients Status Filter */}
          <div style={{ minWidth: 170 }}>
            <select
              className="form-control"
              value={ingredientsFilter}
              onChange={(e) => setIngredientsFilter(e.target.value)}
              style={{ height: 38 }}
            >
              <option value="all">🧪 All Ingredients Status</option>
              <option value="true">✓ Verified Formulations</option>
              <option value="false">⏳ Pending Formulations</option>
            </select>
          </div>

          {/* Reset Filters */}
          {(search || originFilter !== 'all' || concernFilter !== 'all' || ingredientsFilter !== 'all') && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={resetFilters}
              style={{ height: 38, color: 'var(--text-2)' }}
            >
              <X size={14} /> Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Table Card */}
      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div className="loading-row" style={{ padding: '60px 0' }}>
            <div className="spinner" /> Loading Global Catalog…
          </div>
        ) : products.length > 0 ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th style={{ width: '30%' }}>Product</th>
                  <th style={{ width: '16%' }}>Brand & Origin</th>
                  <th style={{ width: '12%' }}>Routine Role</th>
                  <th style={{ width: '16%' }}>Active Ingredients</th>
                  <th style={{ width: '14%' }}>Clinical Concerns</th>
                  <th style={{ width: '12%' }}>La Morph Store</th>
                  <th style={{ textAlign: 'right' }}></th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const isPak = !p.isInternational;
                  const hasIngredients = Boolean(p.ingredientsText && p.ingredientsText.length > 5);

                  return (
                    <tr key={p.id}>
                      {/* Product Name */}
                      <td>
                        <div className="flex items-center gap-3">
                          <div
                            style={{
                              width: 44,
                              height: 44,
                              borderRadius: 8,
                              background: 'var(--surface-2)',
                              overflow: 'hidden',
                              flexShrink: 0,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              border: '1px solid var(--border)',
                            }}
                          >
                            {p.imageUrls?.[0] ? (
                              <img
                                src={p.imageUrls[0]}
                                alt=""
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <Package size={18} color="var(--text-3)" />
                            )}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div
                              style={{
                                fontWeight: 600,
                                fontSize: 13,
                                color: 'var(--text)',
                                lineHeight: 1.3,
                                wordBreak: 'break-word',
                              }}
                            >
                              {p.name}
                            </div>
                            <div className="text-xs text-muted" style={{ marginTop: 2 }}>
                              ID: {p.formulationId}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Brand & Origin Badge */}
                      <td>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text)' }}>
                            {p.brand && p.brand !== 'Unknown' ? p.brand : '—'}
                          </div>
                          <div style={{ marginTop: 4 }}>
                            {isPak ? (
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  fontSize: 11,
                                  fontWeight: 600,
                                  padding: '2px 8px',
                                  borderRadius: 12,
                                  background: 'var(--success-bg)',
                                  color: 'var(--success)',
                                  border: '1px solid var(--success-border)',
                                }}
                              >
                                🇵🇰 Pakistani
                              </span>
                            ) : (
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  fontSize: 11,
                                  fontWeight: 600,
                                  padding: '2px 8px',
                                  borderRadius: 12,
                                  background: 'var(--info-bg)',
                                  color: 'var(--info)',
                                  border: '1px solid var(--info-border)',
                                }}
                              >
                                🌍 International
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Routine Role */}
                      <td>
                        {p.routineRole ? (
                          <span
                            className="badge badge-neutral"
                            style={{
                              textTransform: 'capitalize',
                              fontWeight: 500,
                              fontSize: 12,
                            }}
                          >
                            {p.routineRole.replace(/_/g, ' ')}
                          </span>
                        ) : (
                          <span className="text-muted text-xs">—</span>
                        )}
                      </td>

                      {/* Active Ingredients & Classes */}
                      <td>
                        {p.activeClassesList && p.activeClassesList.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {p.activeClassesList.slice(0, 2).map((act, idx) => (
                              <span
                                key={idx}
                                style={{
                                  fontSize: 10,
                                  fontWeight: 600,
                                  padding: '2px 6px',
                                  borderRadius: 4,
                                  background: 'rgba(92, 74, 66, 0.08)',
                                  color: 'var(--primary)',
                                  textTransform: 'capitalize',
                                }}
                              >
                                {act.replace(/_/g, ' ')}
                              </span>
                            ))}
                            {p.activeClassesList.length > 2 && (
                              <span className="text-xs text-muted">+{p.activeClassesList.length - 2}</span>
                            )}
                          </div>
                        ) : hasIngredients ? (
                          <span className="text-xs text-muted" style={{ color: 'var(--text-3)' }}>
                            Base formula
                          </span>
                        ) : (
                          <span
                            style={{
                              fontSize: 10,
                              padding: '2px 6px',
                              borderRadius: 4,
                              background: 'var(--warning-bg)',
                              color: 'var(--warning)',
                            }}
                          >
                            Pending INCI
                          </span>
                        )}
                      </td>

                      {/* Matched Concerns */}
                      <td>
                        {p.uniqueConcerns && p.uniqueConcerns.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {p.uniqueConcerns.slice(0, 2).map((con, idx) => (
                              <span
                                key={idx}
                                style={{
                                  fontSize: 10,
                                  fontWeight: 500,
                                  padding: '2px 6px',
                                  borderRadius: 4,
                                  background: 'var(--surface-2)',
                                  color: 'var(--text-2)',
                                }}
                              >
                                {formatConcernLabel(con)}
                              </span>
                            ))}
                            {p.uniqueConcerns.length > 2 && (
                              <span className="text-xs text-muted">+{p.uniqueConcerns.length - 2}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted text-xs">None mapped</span>
                        )}
                      </td>

                      {/* La Morph Store Status */}
                      <td>
                        {p.inStore ? (
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: 13 }}>
                              PKR {p.storePrice ?? '—'}
                            </div>
                            <div className="text-xs text-muted">
                              Stock: {p.storeStock > 0 ? `${p.storeStock} units` : <span className="text-danger">Out of stock</span>}
                            </div>
                          </div>
                        ) : (
                          <span className="badge badge-neutral" style={{ fontSize: 10 }}>
                            Not in store
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ padding: '4px 8px', fontSize: 12 }}
                          onClick={() => viewDetails(p)}
                          title="View Details"
                        >
                          <Eye size={14} /> Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state" style={{ padding: '60px 20px' }}>
            <Layers size={40} color="var(--text-3)" />
            <div style={{ fontWeight: 600, fontSize: 16, marginTop: 12 }}>No products match your criteria</div>
            <p className="text-muted" style={{ maxWidth: 400, margin: '8px auto 16px' }}>
              Try adjusting your search terms, origin, or concern filters to discover formulations.
            </p>
            <button className="btn btn-secondary btn-sm" onClick={resetFilters}>
              Reset all filters
            </button>
          </div>
        )}

        {/* Pagination Bar */}
        {total > 0 && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px 20px',
              borderTop: '1px solid var(--border)',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <span className="text-sm text-muted">
                Showing {Math.min((page - 1) * limit + 1, total)} to {Math.min(page * limit, total)} of{' '}
                <strong>{total.toLocaleString()}</strong> products
              </span>
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted">Rows:</span>
                <select
                  className="form-control"
                  style={{
                    width: 'auto',
                    padding: '2px 20px 2px 8px',
                    fontSize: 12,
                    height: 28,
                    minHeight: 28,
                  }}
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPage(1);
                  }}
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                className="btn btn-ghost btn-sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </button>

              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  padding: '4px 10px',
                  borderRadius: 6,
                  background: 'var(--surface-2)',
                  color: 'var(--text)',
                }}
              >
                Page {page} of {totalPages || 1}
              </span>

              <button
                className="btn btn-ghost btn-sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Product Details Modal / Drawer */}
      {selectedProduct &&
        ReactDOM.createPortal(
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.45)',
              backdropFilter: 'blur(3px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: 16,
            }}
            onClick={() => setSelectedProduct(null)}
          >
            <div
              className="card fade-in"
              style={{
                width: '100%',
                maxWidth: 720,
                maxHeight: '90vh',
                overflowY: 'auto',
                background: 'var(--surface)',
                borderRadius: 14,
                boxShadow: 'var(--shadow-lg)',
                padding: 24,
                position: 'relative',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  borderBottom: '1px solid var(--border)',
                  paddingBottom: 16,
                  marginBottom: 20,
                }}
              >
                <div style={{ paddingRight: 24 }}>
                  <div className="flex items-center gap-2" style={{ marginBottom: 6 }}>
                    {loadingDetail && (
                      <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                    )}
                    {!selectedProduct.isInternational ? (
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: 12,
                          background: 'var(--success-bg)',
                          color: 'var(--success)',
                          border: '1px solid var(--success-border)',
                        }}
                      >
                        🇵🇰 Pakistani Brand
                      </span>
                    ) : (
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: 12,
                          background: 'var(--info-bg)',
                          color: 'var(--info)',
                          border: '1px solid var(--info-border)',
                        }}
                      >
                        🌍 International Brand
                      </span>
                    )}

                    {selectedProduct.routineRole && (
                      <span className="badge badge-neutral" style={{ textTransform: 'capitalize' }}>
                        {selectedProduct.routineRole.replace(/_/g, ' ')}
                      </span>
                    )}
                  </div>

                  <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', lineHeight: 1.3 }}>
                    {selectedProduct.name}
                  </h2>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--primary)', marginTop: 2 }}>
                    Brand: {selectedProduct.brand || 'Unspecified'}
                  </div>
                </div>

                <button
                  className="btn btn-ghost btn-icon btn-sm"
                  onClick={() => setSelectedProduct(null)}
                  style={{ position: 'absolute', top: 16, right: 16 }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Content */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Images & Key Identifiers */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: selectedProduct.imageUrls?.[0] ? '140px 1fr' : '1fr',
                    gap: 16,
                  }}
                >
                  {selectedProduct.imageUrls?.[0] && (
                    <div
                      style={{
                        width: 140,
                        height: 140,
                        borderRadius: 10,
                        background: 'var(--surface-2)',
                        border: '1px solid var(--border)',
                        overflow: 'hidden',
                      }}
                    >
                      <img
                        src={selectedProduct.imageUrls[0]}
                        alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                  )}

                  <div
                    style={{
                      background: 'var(--surface-2)',
                      padding: 12,
                      borderRadius: 8,
                      fontSize: 12,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                    }}
                  >
                    <div>
                      <span className="text-muted">Formulation ID: </span>
                      <code style={{ fontSize: 11, background: 'var(--surface)', padding: '1px 4px', borderRadius: 4 }}>
                        {selectedProduct.formulationId}
                      </code>
                    </div>
                    <div>
                      <span className="text-muted">Catalog Eligibility: </span>
                      <span
                        className={`badge ${
                          selectedProduct.catalogEligibility === 'excluded' ? 'badge-danger' : 'badge-success'
                        }`}
                        style={{ fontSize: 10 }}
                      >
                        {selectedProduct.catalogEligibility || 'Eligible'}
                      </span>
                      {selectedProduct.exclusionReason && (
                        <span className="text-muted" style={{ marginLeft: 6 }}>
                          ({selectedProduct.exclusionReason})
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Active Classes */}
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8, color: 'var(--text)' }}>
                    Active Classes & Bioactives:
                  </div>
                  {selectedProduct.activeClassesList && selectedProduct.activeClassesList.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedProduct.activeClassesList.map((cls, idx) => (
                        <span
                          key={idx}
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            padding: '4px 10px',
                            borderRadius: 6,
                            background: 'rgba(92, 74, 66, 0.1)',
                            color: 'var(--primary)',
                            textTransform: 'capitalize',
                          }}
                        >
                          ✨ {cls.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-muted">No specific chemical active classes extracted.</div>
                  )}
                </div>

                {/* Matched Skin Concerns */}
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8, color: 'var(--text)' }}>
                    Clinical Skin Concerns Addressed:
                  </div>
                  {selectedProduct.uniqueConcerns && selectedProduct.uniqueConcerns.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedProduct.uniqueConcerns.map((con, idx) => (
                        <span
                          key={idx}
                          style={{
                            fontSize: 12,
                            fontWeight: 500,
                            padding: '4px 10px',
                            borderRadius: 6,
                            background: 'var(--surface-2)',
                            color: 'var(--text)',
                            border: '1px solid var(--border)',
                          }}
                        >
                          🎯 {formatConcernLabel(con)}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-muted">No evidence-supported clinical skin concerns.</div>
                  )}
                </div>

                {/* Full INCI Ingredients */}
                <div>
                  <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>
                      Full Cosmetic Formulation (INCI):
                    </div>
                    {selectedProduct.ingredientsText && (
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ fontSize: 12, padding: '2px 8px' }}
                        onClick={() => copyToClipboard(selectedProduct.ingredientsText || '')}
                      >
                        {copiedIngredients ? (
                          <>
                            <Check size={13} color="var(--success)" /> Copied
                          </>
                        ) : (
                          <>
                            <Copy size={13} /> Copy INCI
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {selectedProduct.ingredientsText ? (
                    <div
                      style={{
                        padding: 12,
                        borderRadius: 8,
                        background: 'var(--surface-2)',
                        fontFamily: 'monospace',
                        fontSize: 12,
                        lineHeight: 1.6,
                        maxHeight: 180,
                        overflowY: 'auto',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        color: 'var(--text)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      {selectedProduct.ingredientsText}
                    </div>
                  ) : (
                    <div
                      style={{
                        padding: 14,
                        borderRadius: 8,
                        background: 'var(--warning-bg)',
                        border: '1px solid var(--warning-border)',
                        color: 'var(--warning)',
                        fontSize: 12,
                      }}
                    >
                      ⚠️ <strong>Formulation Pending:</strong> Complete chemical INCI is currently queued in the
                      packaging acquisition pipeline.
                    </div>
                  )}
                </div>

                {/* La Morph Store Availability */}
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8, color: 'var(--text)' }}>
                    La Morph Store Availability:
                  </div>
                  {selectedProduct.inStore ? (
                    <div
                      style={{
                        padding: '14px 16px',
                        borderRadius: 8,
                        background: 'var(--surface-2)',
                        border: '1px solid var(--border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <ShoppingBag size={20} color="var(--success)" />
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>
                            Active in Store
                          </div>
                          <div className="text-xs text-muted">
                            Available for user checkout
                          </div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text)' }}>
                          PKR {selectedProduct.storePrice}
                        </div>
                        <div className="text-xs text-muted">
                          Stock: {selectedProduct.storeStock} units
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{
                        padding: 12,
                        borderRadius: 8,
                        background: 'var(--surface-2)',
                        color: 'var(--text-2)',
                        fontSize: 13,
                      }}
                    >
                      Not currently stocked in the store. Exists in the scientific recommendation knowledge base.
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  marginTop: 24,
                  paddingTop: 16,
                  borderTop: '1px solid var(--border)',
                }}
              >
                <button className="btn btn-secondary" onClick={() => setSelectedProduct(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
