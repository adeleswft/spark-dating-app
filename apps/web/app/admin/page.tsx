'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { adminFetch } from '../../lib/api';
import './admin.css';

interface DashboardStats {
  // Core
  totalUsers: number;
  activeToday: number;
  matchesToday: number;
  pendingReports: number;
  subscriptions: Record<string, number>;
  weeklyActivity: any[];
  weeklyMatches: any[];
  // Revenue
  mrr: number;
  arr: number;
  activeSubscribers: number;
  conversionRate: number;
  // Funnel
  totalSwipes: number;
  totalMatches: number;
  swipeToMatchRate: number;
  weeklySwipeToMatchRate: number;
  swipesThisWeek: number;
  matchesThisWeek: number;
  // Retention
  retentionRate7Day: number;
  retentionRate30Day: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  // Reports
  reportResolutionRate: number;
  totalReports: number;
  resolvedReports: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const loadStats = useCallback(async () => {
    try {
      const data = await adminFetch('/stats');
      setStats(data);
      setLastRefresh(new Date());
    } catch (e: any) {
      console.error('Failed to load stats:', e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadStats, 30_000);
    return () => clearInterval(interval);
  }, [loadStats]);

  if (loading) {
    return (
      <div className="admin-grid">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div className="admin-card" key={i}>
            <div className="admin-card-header">
              <span className="admin-card-title">Loading...</span>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-card">
        <div className="admin-card-header">
          <span className="admin-card-title">⚠️ Error Loading Data</span>
        </div>
        <div style={{ color: '#FF5252', padding: '16px' }}>{error}</div>
        <div style={{ color: '#666', padding: '0 16px 16px', fontSize: 13 }}>
          Make sure the API server is running on localhost:3001
        </div>
        <button onClick={loadStats} style={{ margin: '0 16px 16px', padding: '8px 16px', background: '#00E676', color: '#000', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
          Retry
        </button>
      </div>
    );
  }

  const s = stats!;
  const freeCount = s.totalUsers - (s.subscriptions.plus || 0) - (s.subscriptions.elite || 0);

  // ── KPI Cards ────────────────────────────────────────────────
  const CORE_KPI_DATA = [
    { label: 'Total Users', value: s.totalUsers.toLocaleString(), icon: '👥', color: '#FFFFFF' },
    { label: 'Active Today', value: s.activeToday.toLocaleString(), icon: '🔥', color: '#00E676' },
    { label: 'Matches Today', value: s.matchesToday.toLocaleString(), icon: '❤️', color: '#FF5252' },
    { label: 'Pending Reports', value: s.pendingReports.toLocaleString(), icon: '🚨', color: s.pendingReports > 0 ? '#FF9800' : '#4CAF50' },
  ];

  const REVENUE_KPI_DATA = [
    { label: 'MRR', value: `$${s.mrr.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, icon: '💰', color: '#00E676' },
    { label: 'ARR', value: `$${s.arr.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`, icon: '📈', color: '#4CAF50' },
    { label: 'Active Subscribers', value: s.activeSubscribers.toLocaleString(), icon: '⭐', color: '#7C4DFF' },
    { label: 'Free-to-Paid', value: `${s.conversionRate}%`, icon: '🎯', color: '#00BCD4' },
  ];

  const FUNNEL_KPI_DATA = [
    { label: 'Swipe-to-Match', value: `${s.swipeToMatchRate}%`, icon: '🎯', color: '#00E676' },
    { label: 'Weekly Conversion', value: `${s.weeklySwipeToMatchRate}%`, icon: '📊', color: '#FFD600' },
    { label: 'New Users (7d)', value: s.newUsersThisWeek.toLocaleString(), icon: '🆕', color: '#00BCD4' },
    { label: 'New Users (30d)', value: s.newUsersThisMonth.toLocaleString(), icon: '📅', color: '#9C27B0' },
  ];

  const RETENTION_KPI_DATA = [
    { label: '7-Day Retention', value: `${s.retentionRate7Day}%`, icon: '🔄', color: '#00E676' },
    { label: '30-Day Retention', value: `${s.retentionRate30Day}%`, icon: '📊', color: '#4CAF50' },
    { label: 'Reports Resolved', value: `${s.reportResolutionRate}%`, icon: '✅', color: '#4CAF50' },
    { label: 'Total Reports', value: s.totalReports.toLocaleString(), icon: '📋', color: '#FF9800' },
  ];

  const SUBSCRIPTION_DATA = [
    { label: 'Free', count: freeCount, color: '#555' },
    { label: 'Spark+', count: s.subscriptions.plus || 0, color: '#00E676' },
    { label: 'Spark Elite', count: s.subscriptions.elite || 0, color: '#7C4DFF' },
  ];

  const totalSubs = SUBSCRIPTION_DATA.reduce((sum, d) => sum + d.count, 0);

  return (
    <div>
      {/* Refresh indicator */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#00E676', animation: 'pulse 2s infinite' }} />
          <span style={{ fontSize: 12, color: '#666' }}>Auto-refreshes every 30s · Last: {lastRefresh.toLocaleTimeString()}</span>
        </div>
        <button onClick={loadStats} style={{ padding: '6px 12px', background: '#1C1C1C', color: '#A0A0A0', border: '1px solid #2A2A2A', borderRadius: 8, cursor: 'pointer', fontSize: 12 }}>
          ↻ Refresh Now
        </button>
      </div>

      {/* Core KPI Cards */}
      <div style={{ marginBottom: 8 }}>
        <h3 style={{ color: '#FFF', fontSize: 14, fontWeight: 600, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Core Metrics</h3>
        <div className="admin-grid">
          {CORE_KPI_DATA.map((kpi) => (
            <div className="admin-card" key={kpi.label}>
              <div className="admin-card-header">
                <span className="admin-card-title">{kpi.label}</span>
                <span className="admin-card-icon">{kpi.icon}</span>
              </div>
              <div className="admin-card-value" style={{ color: kpi.color }}>{kpi.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Revenue KPI Cards */}
      <div style={{ marginBottom: 8 }}>
        <h3 style={{ color: '#FFF', fontSize: 14, fontWeight: 600, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>💰 Revenue</h3>
        <div className="admin-grid">
          {REVENUE_KPI_DATA.map((kpi) => (
            <div className="admin-card" key={kpi.label}>
              <div className="admin-card-header">
                <span className="admin-card-title">{kpi.label}</span>
                <span className="admin-card-icon">{kpi.icon}</span>
              </div>
              <div className="admin-card-value" style={{ color: kpi.color }}>{kpi.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Funnel KPI Cards */}
      <div style={{ marginBottom: 8 }}>
        <h3 style={{ color: '#FFF', fontSize: 14, fontWeight: 600, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>📊 Funnel & Growth</h3>
        <div className="admin-grid">
          {FUNNEL_KPI_DATA.map((kpi) => (
            <div className="admin-card" key={kpi.label}>
              <div className="admin-card-header">
                <span className="admin-card-title">{kpi.label}</span>
                <span className="admin-card-icon">{kpi.icon}</span>
              </div>
              <div className="admin-card-value" style={{ color: kpi.color }}>{kpi.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Retention & Safety KPI Cards */}
      <div style={{ marginBottom: 8 }}>
        <h3 style={{ color: '#FFF', fontSize: 14, fontWeight: 600, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>🔄 Retention & Safety</h3>
        <div className="admin-grid">
          {RETENTION_KPI_DATA.map((kpi) => (
            <div className="admin-card" key={kpi.label}>
              <div className="admin-card-header">
                <span className="admin-card-title">{kpi.label}</span>
                <span className="admin-card-icon">{kpi.icon}</span>
              </div>
              <div className="admin-card-value" style={{ color: kpi.color }}>{kpi.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginTop: 16 }}>
        {/* Bar Chart — Weekly Activity */}
        <div className="admin-card">
          <div className="admin-card-header">
            <span className="admin-card-title">Weekly Activity (Last 7 Days)</span>
            <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#A0A0A0' }}>
              <span>🟩 Swipes</span>
              <span>🟪 Matches</span>
            </div>
          </div>
          {s.weeklyActivity.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: '#666' }}>No data yet — start swiping!</div>
          ) : (
            <div className="admin-chart">
              {s.weeklyActivity.map((d: any, i: number) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: 140 }}>
                    <div
                      className="admin-bar"
                      style={{
                        height: `${(parseInt(d.count) / Math.max(...s.weeklyActivity.map((w: any) => parseInt(w.count)), 1)) * 130}px`,
                        background: '#00E676',
                        width: 16,
                      }}
                    />
                  </div>
                  <span style={{ fontSize: 11, color: '#666' }}>{d.day}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Donut — Subscription Split */}
        <div className="admin-card">
          <div className="admin-card-header">
            <span className="admin-card-title">Subscription Split</span>
          </div>
          <div className="admin-donut-container">
            <div
              className="admin-donut"
              style={{
                background: `conic-gradient(
                  #00E676 0% ${totalSubs > 0 ? Math.round((SUBSCRIPTION_DATA[1].count / totalSubs) * 100) : 0}%,
                  #7C4DFF ${totalSubs > 0 ? Math.round((SUBSCRIPTION_DATA[1].count / totalSubs) * 100) : 0}% ${totalSubs > 0 ? Math.round(((SUBSCRIPTION_DATA[1].count + SUBSCRIPTION_DATA[2].count) / totalSubs) * 100) : 0}%,
                  #555 ${totalSubs > 0 ? Math.round(((SUBSCRIPTION_DATA[1].count + SUBSCRIPTION_DATA[2].count) / totalSubs) * 100) : 0}% 100%
                )`,
              }}
            >
              <div className="admin-donut-center" style={{ width: 64, height: 64, borderRadius: '50%', background: '#141414', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span className="admin-donut-value">{totalSubs.toLocaleString()}</span>
                <span className="admin-donut-label">users</span>
              </div>
            </div>
            <div className="admin-legend">
              {SUBSCRIPTION_DATA.map((s) => (
                <div className="admin-legend-item" key={s.label}>
                  <div className="admin-legend-dot" style={{ background: s.color }} />
                  <span>{s.label}</span>
                  <span style={{ color: '#666', marginLeft: 'auto' }}>{s.count.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
