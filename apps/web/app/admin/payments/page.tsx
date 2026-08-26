'use client';

import React, { useState, useEffect } from 'react';
import { adminFetch } from '../../../lib/api';
import '../admin.css';

interface Transaction {
  id: string;
  userName: string;
  userEmail: string;
  tier: string;
  platform: string;
  createdAt: string;
  expiresAt: string;
  hasReceipt: boolean;
}

const TIER_LABELS: Record<string, string> = { free: 'Free', plus: 'Spark+', elite: 'Spark Elite' };
const TIER_BADGES: Record<string, string> = { free: 'badge-gray', plus: 'badge-green', elite: 'badge-purple' };

export default function PaymentsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState({ plusCount: 0, eliteCount: 0, totalCount: 0 });
  const [loading, setLoading] = useState(true);
  const [tierFilter, setTierFilter] = useState('all');

  useEffect(() => {
    async function loadPayments() {
      try {
        const data = await adminFetch('/payments');
        setTransactions(data.transactions);
        setStats(data.stats);
      } catch (e: any) {
        console.error('Failed to load payments:', e);
      } finally {
        setLoading(false);
      }
    }
    loadPayments();
  }, []);

  const filtered = tierFilter === 'all'
    ? transactions
    : transactions.filter((t) => t.tier === tierFilter);

  return (
    <div>
      {/* KPIs */}
      <div className="admin-grid" style={{ marginBottom: 16 }}>
        <div className="admin-card">
          <div className="admin-card-header"><span className="admin-card-title">Total Subscribers</span><span className="admin-card-icon">⭐</span></div>
          <div className="admin-card-value">{stats.totalCount.toLocaleString()}</div>
        </div>
        <div className="admin-card">
          <div className="admin-card-header"><span className="admin-card-title">Spark+ Users</span><span className="admin-card-icon">🟢</span></div>
          <div className="admin-card-value" style={{ color: '#00E676' }}>{stats.plusCount.toLocaleString()}</div>
        </div>
        <div className="admin-card">
          <div className="admin-card-header"><span className="admin-card-title">Spark Elite Users</span><span className="admin-card-icon">🟣</span></div>
          <div className="admin-card-value" style={{ color: '#7C4DFF' }}>{stats.eliteCount.toLocaleString()}</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="admin-toolbar">
        <div className="admin-filters">
          <select className="admin-select" value={tierFilter} onChange={(e) => setTierFilter(e.target.value)}>
            <option value="all">All Tiers</option>
            <option value="plus">Spark+</option>
            <option value="elite">Spark Elite</option>
          </select>
        </div>
        <span style={{ fontSize: 13, color: '#666' }}>{filtered.length} subscriptions</span>
      </div>

      {/* Transactions Table */}
      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Plan</th>
              <th>Platform</th>
              <th>Receipt</th>
              <th>Subscribed</th>
              <th>Expires</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', color: '#666', padding: 32 }}>Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', color: '#666', padding: 32 }}>No subscriptions found</td></tr>
            ) : filtered.map((txn) => (
              <tr key={txn.id}>
                <td>
                  <div className="user-cell">
                    <div className="user-avatar">{txn.userName?.[0] || '?'}</div>
                    <div>
                      <div className="user-name">{txn.userName}</div>
                      <div className="user-email">{txn.userEmail}</div>
                    </div>
                  </div>
                </td>
                <td><span className={`badge ${TIER_BADGES[txn.tier] || 'badge-gray'}`}>{TIER_LABELS[txn.tier] || txn.tier}</span></td>
                <td style={{ color: '#A0A0A0' }}>{txn.platform || 'N/A'}</td>
                <td>{txn.hasReceipt ? '✅' : '❌'}</td>
                <td style={{ color: '#A0A0A0', fontSize: 13 }}>{new Date(txn.createdAt).toLocaleDateString()}</td>
                <td style={{ color: '#A0A0A0', fontSize: 13 }}>
                  {txn.expiresAt ? new Date(txn.expiresAt).toLocaleDateString() : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
