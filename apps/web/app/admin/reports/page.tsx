'use client';

import React, { useState, useEffect } from 'react';
import { adminFetch } from '../../../lib/api';
import '../admin.css';

interface Report {
  id: string;
  reason: string;
  description: string;
  severity: string;
  status: string;
  aiTriageScore: number | null;
  reporterName: string;
  reportedName: string;
  reportedEmail: string;
  createdAt: string;
}

const SEVERITY_CONFIG: Record<string, { color: string; label: string; badge: string }> = {
  low: { color: '#A0A0A0', label: 'Low', badge: 'badge-gray' },
  medium: { color: '#FFD600', label: 'Medium', badge: 'badge-yellow' },
  high: { color: '#FF5252', label: 'High', badge: 'badge-red' },
  critical: { color: '#FF1744', label: 'Critical', badge: 'badge-red' },
};

const STATUS_CONFIG: Record<string, { label: string; badge: string }> = {
  pending: { label: 'Pending', badge: 'badge-yellow' },
  reviewed: { label: 'Reviewed', badge: 'badge-green' },
  resolved: { label: 'Resolved', badge: 'badge-gray' },
  dismissed: { label: 'Dismissed', badge: 'badge-gray' },
};

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function loadReports() {
    setLoading(true);
    try {
      const data = await adminFetch('/reports');
      setReports(data.reports);
    } catch (e: any) {
      console.error('Failed to load reports:', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReports();
  }, []);

  const filtered = reports.filter((r) => {
    if (severityFilter !== 'all' && r.severity !== severityFilter) return false;
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    return true;
  });

  const stats = {
    pending: reports.filter((r) => r.status === 'pending').length,
    critical: reports.filter((r) => r.severity === 'critical').length,
    total: reports.length,
  };

  async function handleAction(reportId: string, action: 'resolve' | 'dismiss' | 'ban') {
    try {
      await adminFetch(`/reports/${reportId}/resolve`, {
        method: 'POST',
        body: JSON.stringify({
          action: action === 'ban' ? 'ban' : action === 'dismiss' ? 'restrict' : 'warn',
          reason: action === 'ban' ? 'Admin banned user' : action === 'dismiss' ? 'Report dismissed' : 'Report resolved',
        }),
      });
      loadReports();
    } catch (e: any) {
      alert('Failed: ' + e.message);
    }
  }

  return (
    <div>
      {/* Stats */}
      <div className="admin-grid" style={{ marginBottom: 16 }}>
        <div className="admin-card">
          <div className="admin-card-header"><span className="admin-card-title">Pending Reports</span><span className="admin-card-icon">⏳</span></div>
          <div className="admin-card-value" style={{ color: '#FFD600' }}>{stats.pending}</div>
        </div>
        <div className="admin-card">
          <div className="admin-card-header"><span className="admin-card-title">Critical</span><span className="admin-card-icon">🔴</span></div>
          <div className="admin-card-value" style={{ color: '#FF5252' }}>{stats.critical}</div>
        </div>
        <div className="admin-card">
          <div className="admin-card-header"><span className="admin-card-title">Total Reports</span><span className="admin-card-icon">📋</span></div>
          <div className="admin-card-value">{stats.total}</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="admin-toolbar">
        <div className="admin-filters">
          <select className="admin-select" value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)}>
            <option value="all">All Severity</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select className="admin-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
        <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={loadReports}>🔄 Refresh</button>
      </div>

      {/* Reports List */}
      {loading ? (
        <div className="admin-card" style={{ textAlign: 'center', color: '#666', padding: 32 }}>Loading reports...</div>
      ) : filtered.length === 0 ? (
        <div className="admin-empty">
          <div className="admin-empty-icon">🎉</div>
          <div className="admin-empty-title">All clear!</div>
          <div className="admin-empty-text">No reports match your filters.</div>
        </div>
      ) : (
        filtered.map((report) => {
          const sev = SEVERITY_CONFIG[report.severity] || SEVERITY_CONFIG.low;
          const st = STATUS_CONFIG[report.status] || STATUS_CONFIG.pending;
          const isExpanded = expandedId === report.id;

          return (
            <div
              key={report.id}
              className="report-card"
              style={{ borderColor: report.severity === 'critical' ? '#FF525240' : undefined }}
            >
              <div className="report-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div className="user-avatar" style={{ width: 40, height: 40, fontSize: 16 }}>
                    {report.reportedName?.[0] || '?'}
                  </div>
                  <div>
                    <div className="report-reason">{report.reason}</div>
                    <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
                      Reported <strong style={{ color: '#FFF' }}>{report.reportedName}</strong> by <strong style={{ color: '#A0A0A0' }}>{report.reporterName}</strong>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className={`badge ${sev.badge}`}>{sev.label}</span>
                  <span className={`badge ${st.badge}`}>{st.label}</span>
                  <span style={{ fontSize: 12, color: '#555' }}>
                    {new Date(report.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div
                className="report-body"
                style={{ cursor: 'pointer' }}
                onClick={() => setExpandedId(isExpanded ? null : report.id)}
              >
                {report.description || 'No description provided'}
              </div>

              {isExpanded && report.aiTriageScore != null && (
                <div style={{ marginTop: 12, padding: 12, background: '#1C1C1C', borderRadius: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#A0A0A0', marginBottom: 4 }}>AI TRIAGE SCORE</div>
                  <div style={{ fontSize: 14, color: '#00E676', fontWeight: 700 }}>
                    {report.aiTriageScore.toFixed(1)} / 10
                  </div>
                </div>
              )}

              {report.status === 'pending' && (
                <div className="report-actions">
                  <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => handleAction(report.id, 'dismiss')}>
                    Dismiss
                  </button>
                  <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => handleAction(report.id, 'resolve')}>
                    Mark Reviewed
                  </button>
                  <button
                    className="admin-btn admin-btn-sm"
                    style={{ background: '#FF5252', color: '#FFF' }}
                    onClick={() => handleAction(report.id, 'ban')}
                  >
                    Ban User
                  </button>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
