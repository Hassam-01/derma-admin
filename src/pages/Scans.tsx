import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ReactDOM from 'react-dom';
import { ChevronRight, Image as ImageIcon, X } from 'lucide-react';

import { api } from '../lib/api';

const severityBadge: Record<string, string> = {
  MILD: 'badge-pending',
  MODERATE: 'badge-processing',
  PRONOUNCED: 'badge-shipped',
  SEVERE: 'badge-cancelled',
};

const severityRank: Record<string, number> = {
  MILD: 1,
  MODERATE: 2,
  PRONOUNCED: 3,
  SEVERE: 4,
};

interface ScanIssue {
  id: string;
  issueType: string;
  severity: string;
  confidence: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ScanUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

interface ScanProfile {
  id: string;
  name: string;
  user?: ScanUser;
}

interface ScanRecord {
  id: string;
  imageUrl?: string | null;
  overallScore?: number | null;
  notes?: string | null;
  wrinkleNotes?: string | null;
  eyeBagNotes?: string | null;
  createdAt?: string;
  issues: ScanIssue[];
  profile?: ScanProfile;
}

interface RecommendationMatchedIngredient {
  ingredientId: string;
  name: string;
  concentrationText?: string | null;
  contribution: number;
}

interface RecommendationMatchedConcern {
  concern: string;
  displayName: string;
  score: number;
  severity: string;
  confidence: number;
  matchedIngredients: RecommendationMatchedIngredient[];
  rationale: string[];
}

interface RecommendationProduct {
  productId: string;
  name: string;
  category: { name: string; slug: string };
  vendor: { name: string };
  pricing: { price: number; discountPrice?: number | null };
  matchedConcerns: RecommendationMatchedConcern[];
}

interface RecommendationConcernGroup {
  concern: string;
  displayName: string;
  issueType: string;
  severity: string;
  confidence: number;
  potentialCauses: string[];
  products: RecommendationProduct[];
}

interface RecommendationAvoidItem {
  label: string;
  reason: string;
}

interface RecommendationAvoidGroup {
  concern: string;
  displayName: string;
  items: RecommendationAvoidItem[];
}

interface ScanRecommendations {
  concerns: Array<{
    key: string;
    displayName: string;
    issueType: string;
    severity: string;
    confidence: number;
    potentialCauses: string[];
  }>;
  recommendationsByConcern: RecommendationConcernGroup[];
  avoidByConcern: RecommendationAvoidGroup[];
}

interface ScansResponse {
  data: ScanRecord[];
  total: number;
  page: number;
  limit: number;
}

interface ScanDetailModalProps {
  scan: ScanRecord;
  onClose: () => void;
}

function toTitleCase(value: string | null | undefined) {
  return (value ?? '')
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

function formatPercent(value: number | null | undefined, fractionDigits = 0) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '-';
  return `${(value * 100).toFixed(fractionDigits)}%`;
}

function issueArea(issue: ScanIssue) {
  return Math.max(0, issue.width) * Math.max(0, issue.height);
}

function issueCenter(issue: ScanIssue) {
  return {
    x: issue.x + issue.width / 2,
    y: issue.y + issue.height / 2,
  };
}

function spreadLabel(area: number) {
  const percentArea = area * 100;
  if (percentArea < 1) return 'Pinpoint';
  if (percentArea < 3) return 'Localized';
  if (percentArea < 7) return 'Focused';
  if (percentArea < 14) return 'Broad';
  return 'Extensive';
}

function regionLabel(issue: ScanIssue) {
  const type = (issue.issueType ?? '').toLowerCase();
  const center = issueCenter(issue);

  if (type.includes('left eye bag')) return 'Left under-eye';
  if (type.includes('right eye bag')) return 'Right under-eye';
  if (type.includes('under-eye area') || type.includes('eye bag')) return 'Under-eye area';
  if (type.includes('wrinkle')) return 'Face texture map';

  const horizontal = center.x < 0.33 ? 'Left' : center.x > 0.66 ? 'Right' : 'Center';
  const vertical = center.y < 0.33 ? 'Upper' : center.y > 0.66 ? 'Lower' : 'Mid';

  return `${vertical} ${horizontal} face`;
}

function strongestSeverity(issues: ScanIssue[]) {
  return issues.reduce<string>((best, issue) => {
    const current = (issue.severity ?? '').toUpperCase();
    if (!best) return current;
    return (severityRank[current] ?? 0) > (severityRank[best] ?? 0) ? current : best;
  }, '');
}

function averageConfidence(issues: ScanIssue[]) {
  if (issues.length === 0) return 0;
  return issues.reduce((sum, issue) => sum + (issue.confidence ?? 0), 0) / issues.length;
}

function totalCoverage(issues: ScanIssue[]) {
  return issues.reduce((sum, issue) => sum + issueArea(issue), 0);
}

function extractWrinkleCoverage(scan: ScanRecord) {
  const source = [scan.wrinkleNotes, scan.notes].filter(Boolean).join(' ');
  const match = source.match(/Wrinkle coverage\s+([0-9]+(?:\.[0-9]+)?)%/i);
  return match ? Number(match[1]) / 100 : null;
}

function summaryStat(label: string, value: string) {
  return (
    <div
      style={{
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        padding: '12px 14px',
        background: 'var(--surface)',
      }}
    >
      <div className="text-sm text-muted">{label}</div>
      <div style={{ fontWeight: 700, marginTop: 4 }}>{value}</div>
    </div>
  );
}

const ScanDetailModal: React.FC<ScanDetailModalProps> = ({ scan, onClose }) => {
  const [recommendations, setRecommendations] = useState<ScanRecommendations | null>(null);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);

  const fullName = [scan.profile?.user?.firstName, scan.profile?.user?.lastName]
    .filter(Boolean)
    .join(' ')
    .trim();

  const wrinkleCoverage = useMemo(() => extractWrinkleCoverage(scan), [scan]);

  const issueSummary = useMemo(() => {
    const issues = Array.isArray(scan.issues) ? scan.issues : [];
    const nonWrinkleIssues = issues.filter(
      (issue) => !(issue.issueType ?? '').toLowerCase().includes('wrinkle'),
    );
    const nonWrinkleCoverage = totalCoverage(nonWrinkleIssues);

    return {
      strongestSeverity: strongestSeverity(issues),
      averageConfidence: averageConfidence(issues),
      totalCoverage: nonWrinkleCoverage,
      spread: spreadLabel(nonWrinkleCoverage),
    };
  }, [scan.issues]);

  useEffect(() => {
    let active = true;

    const profileId = scan.profile?.id;
    if (!profileId) return undefined;

    const load = async () => {
      try {
        setRecommendationsLoading(true);
        const res = await api.get(`/profiles/${profileId}/recommendations/products`, {
          params: {
            scanId: scan.id,
            limit: 6,
            perConcernLimit: 3,
          },
        });
        if (!active) return;
        setRecommendations(res.data.data as ScanRecommendations);
      } catch (error) {
        console.error('Failed to load scan recommendations', error);
        if (active) setRecommendations(null);
      } finally {
        if (active) setRecommendationsLoading(false);
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [scan.id, scan.profile?.id]);

  return ReactDOM.createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="modal-title">Scan Details</div>
            <div className="text-sm text-muted mono" style={{ marginTop: 2 }}>
              {scan.id}
            </div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
          <div className="detail-row">
            <div className="detail-label">User</div>
            <div className="detail-value">{fullName || '-'}</div>
          </div>
          <div className="detail-row">
            <div className="detail-label">Email</div>
            <div className="detail-value">{scan.profile?.user?.email ?? '-'}</div>
          </div>
          <div className="detail-row">
            <div className="detail-label">Profile</div>
            <div className="detail-value">{scan.profile?.name ?? '-'}</div>
          </div>
          <div className="detail-row">
            <div className="detail-label">Created</div>
            <div className="detail-value">
              {scan.createdAt ? new Date(scan.createdAt).toLocaleString() : '-'}
            </div>
          </div>
          <div className="detail-row">
            <div className="detail-label">Overall Score</div>
            <div className="detail-value" style={{ fontWeight: 600 }}>
              {scan.overallScore ?? '-'}
            </div>
          </div>
          <div className="detail-row">
            <div className="detail-label">Cloud Image</div>
            <div className="detail-value">{scan.imageUrl ? 'Stored' : 'Not synced'}</div>
          </div>

          <hr className="divider" />

          <div className="form-label" style={{ marginBottom: 8 }}>Condition Summary</div>
          <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
            {summaryStat('Detected conditions', String(scan.issues?.length ?? 0))}
            {summaryStat('Strongest severity', toTitleCase(issueSummary.strongestSeverity || 'Unknown'))}
            {summaryStat('Average confidence', formatPercent(issueSummary.averageConfidence, 0))}
            {summaryStat('Estimated spread', issueSummary.totalCoverage > 0 ? `${issueSummary.spread} (${formatPercent(issueSummary.totalCoverage, 1)})` : 'Condition-specific')}
            {summaryStat('Wrinkle mask coverage', wrinkleCoverage != null ? formatPercent(wrinkleCoverage, 1) : 'Not available')}
          </div>

          <hr className="divider" />

          <div className="form-label" style={{ marginBottom: 8 }}>Detected Conditions</div>
          {Array.isArray(scan.issues) && scan.issues.length > 0 ? (
            <div style={{ display: 'grid', gap: 10 }}>
              {scan.issues.map((issue) => {
                const area = issueArea(issue);
                const center = issueCenter(issue);
                const spread = spreadLabel(area);
                const normalizedType = (issue.issueType ?? '').toLowerCase();
                const isWrinkle = normalizedType.includes('wrinkle');
                const isEyeBag = normalizedType.includes('under-eye') || normalizedType.includes('eye bag');

                return (
                  <div
                    key={issue.id}
                    style={{
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)',
                      padding: '12px 14px',
                      background: 'var(--surface-2)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 700 }}>{toTitleCase(issue.issueType)}</div>
                        <div className="text-sm text-muted" style={{ marginTop: 4 }}>
                          {regionLabel(issue)}
                        </div>
                      </div>
                      <span className={`badge ${severityBadge[(issue.severity ?? '').toUpperCase()] ?? 'badge-neutral'}`}>
                        {toTitleCase(issue.severity || 'Unknown')}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', marginTop: 12 }}>
                      {summaryStat('Confidence', formatPercent(issue.confidence, 0))}
                      {summaryStat('Spread', isWrinkle ? 'Texture-based' : spread)}
                      {summaryStat(
                        isWrinkle ? 'Mask coverage' : isEyeBag ? 'ROI size' : 'Coverage',
                        isWrinkle
                          ? wrinkleCoverage != null
                            ? formatPercent(wrinkleCoverage, 1)
                            : 'Not available'
                          : formatPercent(area, 1),
                      )}
                      {summaryStat('Center', `${formatPercent(center.x, 0)}, ${formatPercent(center.y, 0)}`)}
                    </div>

                    <div className="text-sm text-muted" style={{ marginTop: 10 }}>
                      {isWrinkle
                        ? 'Bounding box marks the facial texture analysis region. True wrinkle coverage comes from the model mask, not the full face box.'
                        : isEyeBag
                          ? `ROI box: x ${formatPercent(issue.x, 1)}, y ${formatPercent(issue.y, 1)}, w ${formatPercent(issue.width, 1)}, h ${formatPercent(issue.height, 1)}`
                          : `Bounding box: x ${formatPercent(issue.x, 1)}, y ${formatPercent(issue.y, 1)}, w ${formatPercent(issue.width, 1)}, h ${formatPercent(issue.height, 1)}`}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '16px 0' }}>
              <p>No issues stored for this scan.</p>
            </div>
          )}

          {(scan.notes || scan.wrinkleNotes || scan.eyeBagNotes) && (
            <>
              <hr className="divider" />
              <div className="form-label" style={{ marginBottom: 8 }}>Scan Notes</div>
              <div style={{ display: 'grid', gap: 10 }}>
                {scan.notes ? (
                  <div>
                    <div className="text-sm" style={{ fontWeight: 600, marginBottom: 4 }}>Summary</div>
                    <div className="text-sm text-muted">{scan.notes}</div>
                  </div>
                ) : null}
                {scan.wrinkleNotes ? (
                  <div>
                    <div className="text-sm" style={{ fontWeight: 600, marginBottom: 4 }}>Wrinkle Notes</div>
                    <div className="text-sm text-muted">{scan.wrinkleNotes}</div>
                  </div>
                ) : null}
                {scan.eyeBagNotes ? (
                  <div>
                    <div className="text-sm" style={{ fontWeight: 600, marginBottom: 4 }}>Eye Bag Notes</div>
                    <div className="text-sm text-muted">{scan.eyeBagNotes}</div>
                  </div>
                ) : null}
              </div>
            </>
          )}

          <hr className="divider" />
          <div className="form-label" style={{ marginBottom: 8 }}>Recommendations</div>
          {recommendationsLoading ? (
            <div className="text-sm text-muted">Loading recommendations...</div>
          ) : recommendations ? (
            <div style={{ display: 'grid', gap: 14 }}>
              {recommendations.recommendationsByConcern.map((group) => {
                const avoid = recommendations.avoidByConcern.find((item) => item.concern === group.concern);

                return (
                  <div
                    key={group.concern}
                    style={{
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)',
                      padding: '14px',
                      background: 'var(--surface-2)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 700 }}>{group.displayName}</div>
                        <div className="text-sm text-muted" style={{ marginTop: 4 }}>
                          {toTitleCase(group.issueType)} | {toTitleCase(group.severity)} | {Math.round(group.confidence * 100)}% confidence
                        </div>
                      </div>
                      <span className={`badge ${severityBadge[(group.severity ?? '').toUpperCase()] ?? 'badge-neutral'}`}>
                        {toTitleCase(group.severity)}
                      </span>
                    </div>

                    <div style={{ marginTop: 12 }}>
                      <div className="text-sm" style={{ fontWeight: 700, marginBottom: 8 }}>Suggested products</div>
                      {(group.products ?? []).length > 0 ? (
                        <div style={{ display: 'grid', gap: 10 }}>
                          {(group.products ?? []).map((product) => {
                            const concernMatch = product.matchedConcerns.find((item) => item.concern === group.concern);
                            return (
                              <div
                                key={product.productId}
                                style={{
                                  padding: '12px',
                                  borderRadius: 12,
                                  border: '1px solid var(--border)',
                                  background: 'var(--surface)',
                                }}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                                  <div>
                                    <div style={{ fontWeight: 700 }}>{product.name}</div>
                                    <div className="text-sm text-muted" style={{ marginTop: 4 }}>
                                      {[product.category?.name, product.vendor?.name].filter(Boolean).join(' | ')}
                                    </div>
                                  </div>
                                  <div style={{ fontWeight: 700 }}>
                                    Rs {Math.round(product.pricing?.discountPrice ?? product.pricing?.price ?? 0)}
                                  </div>
                                </div>

                                {concernMatch?.matchedIngredients?.length ? (
                                  <div style={{ marginTop: 10 }}>
                                    <div className="text-sm" style={{ fontWeight: 600, marginBottom: 6 }}>
                                      Suggested ingredients
                                    </div>
                                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                      {concernMatch.matchedIngredients.map((ingredient) => (
                                        <span key={`${product.productId}-${ingredient.ingredientId}`} className="badge badge-neutral">
                                          {ingredient.name}{ingredient.concentrationText ? ` ${ingredient.concentrationText}` : ''}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                ) : null}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-sm text-muted">No matched products returned for this concern.</div>
                      )}
                    </div>

                    {avoid?.items?.length ? (
                      <div style={{ marginTop: 12 }}>
                        <div className="text-sm" style={{ fontWeight: 700, marginBottom: 6 }}>Avoid</div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {avoid.items.map((item, index) => (
                            <span key={`${group.concern}-avoid-${index}`} className="badge badge-cancelled">
                              {item.label}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {group.potentialCauses?.length ? (
                      <div style={{ marginTop: 12 }}>
                        <div className="text-sm" style={{ fontWeight: 700, marginBottom: 6 }}>Potential causes</div>
                        <div style={{ display: 'grid', gap: 6 }}>
                          {group.potentialCauses.map((cause, index) => (
                            <div key={`${group.concern}-cause-${index}`} className="text-sm text-muted">
                              - {cause}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-sm text-muted">Recommendation details are unavailable for this scan.</div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export const Scans: React.FC = () => {
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ScanRecord | null>(null);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [issueType, setIssueType] = useState('');
  const [severity, setSeverity] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const fetchScans = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string | number> = { page, limit };
      if (search.trim()) params.search = search.trim();
      if (issueType) params.issueType = issueType;
      if (severity) params.severity = severity;

      const res = await api.get('/executive/analytics/scans', { params });
      const body = res.data.data as ScanRecord[] | ScansResponse;
      setScans(Array.isArray(body) ? body : body.data ?? []);
      setTotal(Array.isArray(body) ? body.length : body.total ?? 0);
    } catch (err) {
      console.error('Failed to fetch scans', err);
      setScans([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [issueType, page, search, severity]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchScans();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [fetchScans]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <div className="page-title">Scans</div>
          <div className="page-subtitle">Review stored scan conditions, user details, and condition notes</div>
        </div>
      </div>

      <div className="toolbar" style={{ gap: 10, flexWrap: 'wrap' }}>
        <input
          className="form-control"
          style={{ minWidth: 240, flex: '1 1 260px' }}
          placeholder="Search user, email, or profile"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              setPage(1);
              setSearch(searchInput);
            }
          }}
        />
        <button
          className="btn btn-secondary"
          onClick={() => {
            setPage(1);
            setSearch(searchInput);
          }}
        >
          Search
        </button>
        <input
          className="form-control"
          style={{ width: 180 }}
          placeholder="Issue type"
          value={issueType}
          onChange={(e) => {
            setPage(1);
            setIssueType(e.target.value);
          }}
        />
        <select
          className="form-control"
          style={{ width: 180 }}
          value={severity}
          onChange={(e) => {
            setPage(1);
            setSeverity(e.target.value);
          }}
        >
          <option value="">All Severities</option>
          <option value="Mild">Mild</option>
          <option value="Moderate">Moderate</option>
          <option value="Pronounced">Pronounced</option>
          <option value="Severe">Severe</option>
        </select>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div className="loading-row"><div className="spinner" /> Loading scans...</div>
        ) : scans.length > 0 ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Profile</th>
                  <th>Date</th>
                  <th>Score</th>
                  <th>Conditions</th>
                  <th>Cloud Image</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {scans.map((scan) => {
                  const fullName = [scan.profile?.user?.firstName, scan.profile?.user?.lastName]
                    .filter(Boolean)
                    .join(' ')
                    .trim();

                  return (
                    <tr key={scan.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{fullName || '-'}</div>
                        <div className="text-sm text-muted">{scan.profile?.user?.email ?? '-'}</div>
                      </td>
                      <td>{scan.profile?.name ?? '-'}</td>
                      <td className="text-muted">
                        {scan.createdAt ? new Date(scan.createdAt).toLocaleString() : '-'}
                      </td>
                      <td style={{ fontWeight: 600 }}>{scan.overallScore ?? '-'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {Array.isArray(scan.issues) && scan.issues.length > 0 ? (
                            scan.issues.slice(0, 3).map((issue) => (
                              <span
                                key={issue.id}
                                className={`badge ${severityBadge[(issue.severity ?? '').toUpperCase()] ?? 'badge-neutral'}`}
                              >
                                {toTitleCase(issue.issueType)}
                              </span>
                            ))
                          ) : (
                            <span className="text-muted">No issues</span>
                          )}
                          {Array.isArray(scan.issues) && scan.issues.length > 3 ? (
                            <span className="badge badge-neutral">+{scan.issues.length - 3}</span>
                          ) : null}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${scan.imageUrl ? 'badge-success' : 'badge-neutral'}`}>
                          {scan.imageUrl ? 'Stored' : 'Not synced'}
                        </span>
                      </td>
                      <td>
                        <button className="btn btn-ghost btn-icon" onClick={() => setSelected(scan)}>
                          <ChevronRight size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <ImageIcon size={36} color="var(--text-3)" />
            <p>No scans found</p>
          </div>
        )}
      </div>

      <div className="toolbar" style={{ justifyContent: 'space-between', marginTop: 16 }}>
        <div className="text-sm text-muted">Showing {scans.length} of {total} scans</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="btn btn-secondary btn-sm"
            disabled={page <= 1}
            onClick={() => setPage((value) => Math.max(1, value - 1))}
          >
            Previous
          </button>
          <div className="text-sm text-muted" style={{ alignSelf: 'center' }}>
            Page {page} / {totalPages}
          </div>
          <button
            className="btn btn-secondary btn-sm"
            disabled={page >= totalPages}
            onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
          >
            Next
          </button>
        </div>
      </div>

      {selected ? <ScanDetailModal scan={selected} onClose={() => setSelected(null)} /> : null}
    </div>
  );
};