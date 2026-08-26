'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { adminFetch } from '../../../lib/api';
import '../admin.css';

interface User {
  id: string;
  name: string;
  email: string;
  dob: string;
  subscriptionTier: string;
  verified: boolean;
  photoVerified: boolean;
  idVerified: boolean;
  isAdmin: boolean;
  createdAt: string;
  lastActiveAt: string;
  swipeCount: number;
  messageCount: number;
}

const TIER_LABELS: Record<string, string> = { free: 'Free', plus: 'Spark+', elite: 'Elite' };
const TIER_COLORS: Record<string, string> = { free: 'badge-gray', plus: 'badge-green', elite: 'badge-purple' };

function calcAge(dob: string): number {
  if (!dob) return 0;
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function timeAgo(dateStr: string): string {
  if (!dateStr) return 'Never';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (tierFilter !== 'all') params.set('tier', tierFilter);
      const data = await adminFetch(`/users?${params}`);
      setUsers(data.users);
      setTotal(data.total);
    } catch (e: any) {
      console.error('Failed to load users:', e);
    } finally {
      setLoading(false);
    }
  }, [search, tierFilter]);

  useEffect(() => {
    const debounce = setTimeout(loadUsers, 300);
    return () => clearTimeout(debounce);
  }, [loadUsers]);

  async function viewUser(userId: string) {
    setDetailLoading(true);
    try {
      const user = await adminFetch(`/users/${userId}`);
      setSelectedUser(user);
    } catch (e: any) {
      console.error('Failed to load user:', e);
    } finally {
      setDetailLoading(false);
    }
  }

  async function banUser(userId: string) {
    if (!confirm('Are you sure you want to permanently ban this user?')) return;
    try {
      await adminFetch(`/users/${userId}/ban`, {
        method: 'POST',
        body: JSON.stringify({ reason: 'Admin ban — Terms of Service violation' }),
      });
      alert('User has been banned.');
      loadUsers();
      setSelectedUser(null);
    } catch (e: any) {
      alert('Failed: ' + e.message);
    }
  }

  async function suspendUser(userId: string) {
    if (!confirm('Suspend this user? They will be restricted from using the platform.')) return;
    try {
      await adminFetch(`/users/${userId}/suspend`, {
        method: 'POST',
        body: JSON.stringify({ reason: 'Admin suspension' }),
      });
      alert('User has been suspended.');
      loadUsers();
      setSelectedUser(null);
    } catch (e: any) {
      alert('Failed: ' + e.message);
    }
  }

  return (
    <div>
      {/* Stats Row */}
      <div className="admin-grid" style={{ marginBottom: 16 }}>
        <div className="admin-card">
          <div className="admin-card-header"><span className="admin-card-title">Total Users</span></div>
          <div className="admin-card-value">{total.toLocaleString()}</div>
        </div>
        <div className="admin-card">
          <div className="admin-card-header"><span className="admin-card-title">Showing</span></div>
          <div className="admin-card-value" style={{ color: '#00E676' }}>{users.length}</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="admin-toolbar">
        <div className="admin-filters">
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              background: '#1C1C1C', border: '1px solid #2A2A2A', borderRadius: 8,
              color: '#FFF', padding: '8px 12px', fontSize: 13, width: 240, outline: 'none',
            }}
          />
          <select className="admin-select" value={tierFilter} onChange={(e) => setTierFilter(e.target.value)}>
            <option value="all">All Tiers</option>
            <option value="free">Free</option>
            <option value="plus">Spark+</option>
            <option value="elite">Elite</option>
          </select>
        </div>
        <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={loadUsers}>🔄 Refresh</button>
      </div>

      {/* Table */}
      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Age</th>
              <th>Tier</th>
              <th>Verified</th>
              <th>Swipes</th>
              <th>Messages</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', color: '#666', padding: 32 }}>Loading...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', color: '#666', padding: 32 }}>No users found</td></tr>
            ) : users.map((user) => (
              <tr key={user.id}>
                <td>
                  <div className="user-cell">
                    <div className="user-avatar">{user.name?.[0] || '?'}</div>
                    <div>
                      <div className="user-name">{user.name}</div>
                      <div className="user-email">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td>{calcAge(user.dob)}</td>
                <td><span className={`badge ${TIER_COLORS[user.subscriptionTier] || 'badge-gray'}`}>{TIER_LABELS[user.subscriptionTier] || user.subscriptionTier}</span></td>
                <td>
                  <span style={{ fontSize: 14 }}>
                    {user.photoVerified ? '🟢' : user.verified ? '🟡' : '🔴'}
                  </span>
                </td>
                <td>{user.swipeCount}</td>
                <td>{user.messageCount}</td>
                <td style={{ color: '#A0A0A0', fontSize: 13 }}>{timeAgo(user.createdAt)}</td>
                <td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => viewUser(user.id)}>
                      View
                    </button>
                    <button className="admin-btn admin-btn-danger admin-btn-sm" onClick={() => banUser(user.id)}>
                      Ban
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* User Detail Modal */}
      {selectedUser && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.7)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          }}
          onClick={() => setSelectedUser(null)}
        >
          <div
            style={{
              background: '#141414', borderRadius: 16, padding: 32,
              width: 480, maxWidth: '90vw', border: '1px solid #1C1C1C',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
              <div className="user-avatar" style={{ width: 56, height: 56, fontSize: 22 }}>
                {selectedUser.name?.[0] || '?'}
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#FFF' }}>{selectedUser.name}</div>
                <div style={{ fontSize: 13, color: '#666' }}>{selectedUser.email}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              {[
                ['Age', String(calcAge(selectedUser.dob))],
                ['Tier', TIER_LABELS[selectedUser.subscription?.tier] || 'Free'],
                ['Swipes', String(selectedUser.swipeCount || 0)],
                ['Messages', String(selectedUser.messageCount || 0)],
                ['Reports', String(selectedUser.reportCount || 0)],
                ['Interests', (selectedUser.interests || []).join(', ') || 'None'],
                ['Photo Verified', selectedUser.photoVerified ? '✅' : '❌'],
                ['ID Verified', selectedUser.idVerified ? '✅' : '❌'],
              ].map(([label, value]) => (
                <div key={label} style={{ background: '#1C1C1C', borderRadius: 8, padding: '10px 14px' }}>
                  <div style={{ fontSize: 11, color: '#666', textTransform: 'uppercase' }}>{label}</div>
                  <div style={{ fontSize: 14, color: '#FFF', fontWeight: 600, marginTop: 2 }}>{value}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="admin-btn admin-btn-ghost" onClick={() => setSelectedUser(null)}>Close</button>
              <button className="admin-btn admin-btn-danger admin-btn-sm" onClick={() => suspendUser(selectedUser.id)}>
                Suspend
              </button>
              <button className="admin-btn admin-btn-sm" style={{ background: '#FF5252', color: '#FFF' }} onClick={() => banUser(selectedUser.id)}>
                Ban User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
