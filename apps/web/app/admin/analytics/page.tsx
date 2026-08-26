'use client';

import React, { useEffect, useState } from 'react';
import { adminFetch } from '../../../lib/api';
import '../admin.css';

interface AnalyticsData {
  userGrowth: any[];
  totalMatches: number;
  totalMessages: number;
  avgMessagesPerMatch: number;
  subscriptionDistribution: any[];
  verificationRate: number;
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        const data = await adminFetch('/analytics');
        setAnalytics(data);
      } catch (e: any) {
        console.error('Failed to load analytics:', e);
      } finally {
        setLoading(false);
      }
    }
    loadAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="admin-card">
        <div className="admin-card-header">
          <span className="admin-card-title">Loading analytics...</span>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="admin-card">
        <div className="admin-card-header">
          <span className="admin-card-title">⚠️ Failed to load analytics</span>
        </div>
      </div>
    );
  }

  const maxGrowth = Math.max(...analytics.userGrowth.map((d) => parseInt(d.count)), 1);

  return (
    <div>
      {/* Key Metrics */}
      <div className="admin-grid" style={{ marginBottom: 16 }}>
        <div className="admin-card">
          <div className="admin-card-header"><span className="admin-card-title">Total Matches</span><span className="admin-card-icon">❤️</span></div>
          <div className="admin-card-value" style={{ color: '#00E676' }}>{analytics.totalMatches.toLocaleString()}</div>
        </div>
        <div className="admin-card">
          <div className="admin-card-header"><span className="admin-card-title">Total Messages</span><span className="admin-card-icon">💬</span></div>
          <div className="admin-card-value">{analytics.totalMessages.toLocaleString()}</div>
        </div>
        <div className="admin-card">
          <div className="admin-card-header"><span className="admin-card-title">Avg Messages/Match</span><span className="admin-card-icon">📊</span></div>
          <div className="admin-card-value">{analytics.avgMessagesPerMatch}</div>
        </div>
        <div className="admin-card">
          <div className="admin-card-header"><span className="admin-card-title">Verification Rate</span><span className="admin-card-icon">✅</span></div>
          <div className="admin-card-value" style={{ color: '#00E676' }}>{analytics.verificationRate}%</div>
        </div>
      </div>

      {/* User Growth Chart */}
      <div className="admin-card" style={{ marginBottom: 16 }}>
        <div className="admin-card-header">
          <span className="admin-card-title">User Growth</span>
        </div>
        {analytics.userGrowth.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#666' }}>No growth data yet — seed the database first!</div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 200, paddingTop: 16 }}>
            {analytics.userGrowth.map((d: any, i: number) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ fontSize: 10, color: '#A0A0A0', marginBottom: 4 }}>{parseInt(d.count)}</span>
                <div
                  style={{
                    height: `${(parseInt(d.count) / maxGrowth) * 170}px`,
                    background: 'linear-gradient(180deg, #00E676, #00BFA5)',
                    borderRadius: '3px 3px 0 0',
                    width: 24,
                    minHeight: 4,
                  }}
                />
                <span style={{ fontSize: 11, color: '#666', marginTop: 8 }}>{d.month}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Subscription Distribution */}
      <div className="admin-card">
        <div className="admin-card-header">
          <span className="admin-card-title">Subscription Distribution</span>
        </div>
        {analytics.subscriptionDistribution.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#666' }}>No subscriptions yet</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '16px 0' }}>
            {analytics.subscriptionDistribution.map((sub: any, i: number) => {
              const total = analytics.subscriptionDistribution.reduce((s: number, x: any) => s + parseInt(x.count), 0);
              const pct = total > 0 ? Math.round((parseInt(sub.count) / total) * 100) : 0;
              const color = sub.tier === 'plus' ? '#00E676' : sub.tier === 'elite' ? '#7C4DFF' : '#555';
              return (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, color: '#E0E0E0', textTransform: 'capitalize' }}>{sub.tier || 'Free'}</span>
                    <span style={{ fontSize: 13, color: '#A0A0A0', fontWeight: 600 }}>
                      {parseInt(sub.count).toLocaleString()} ({pct}%)
                    </span>
                  </div>
                  <div style={{ height: 8, background: '#1C1C1C', borderRadius: 4, overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${pct}%`,
                        background: color,
                        borderRadius: 4,
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
