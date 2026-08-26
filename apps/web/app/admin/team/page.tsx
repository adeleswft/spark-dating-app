'use client';

import React, { useState, useEffect } from 'react';
import { adminFetch } from '../../../lib/api';
import '../admin.css';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  lastActiveAt: string;
}

interface AdminInfo {
  id: string;
  name: string;
  email: string;
  role: string;
}

const ROLE_CONFIG: Record<string, { label: string; badge: string; color: string }> = {
  super_admin: { label: 'Super Admin', badge: 'badge-purple', color: '#7C4DFF' },
  admin: { label: 'Admin', badge: 'badge-green', color: '#00E676' },
  user: { label: 'User', badge: 'badge-gray', color: '#A0A0A0' },
};

export default function TeamPage() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [me, setMe] = useState<AdminInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [promoting, setPromoting] = useState(false);
  const [promoteEmail, setPromoteEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isSuperAdmin = me?.role === 'super_admin';

  async function loadData() {
    setLoading(true);
    try {
      const [adminsData, meData] = await Promise.all([
        adminFetch('/admins'),
        adminFetch('/me'),
      ]);
      setAdmins(adminsData.admins);
      setMe(meData);
    } catch (e: any) {
      console.error('Failed to load admin data:', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handlePromote() {
    if (!promoteEmail) return;
    setError('');
    setSuccess('');
    setPromoting(true);

    try {
      // First find user by email from the users list
      const userData = await adminFetch(`/users?search=${encodeURIComponent(promoteEmail)}`);
      const user = userData.users?.find((u: any) => u.email === promoteEmail);

      if (!user) {
        setError('User not found');
        return;
      }

      await adminFetch('/admins/promote', {
        method: 'POST',
        body: JSON.stringify({ userId: user.id, role: 'admin' }),
      });

      setSuccess(`Promoted ${user.name} to admin`);
      setPromoteEmail('');
      loadData();
    } catch (e: any) {
      setError(e.message || 'Failed to promote user');
    } finally {
      setPromoting(false);
    }
  }

  async function handleDemote(userId: string, name: string) {
    if (!confirm(`Remove ${name} from the admin team?`)) return;

    try {
      await adminFetch('/admins/demote', {
        method: 'POST',
        body: JSON.stringify({ userId }),
      });
      setSuccess(`Removed ${name} from admin team`);
      loadData();
    } catch (e: any) {
      setError(e.message || 'Failed to demote user');
    }
  }

  const filtered = admins.filter((a) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return a.name.toLowerCase().includes(q) || a.email.toLowerCase().includes(q);
  });

  if (loading) {
    return (
      <div className="admin-card">
        <div style={{ textAlign: 'center', color: '#666', padding: 32 }}>Loading team...</div>
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="admin-card">
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#FFF', marginBottom: 8 }}>Super Admin Required</div>
          <div style={{ fontSize: 14, color: '#666' }}>
            Only super admins can manage the admin team.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Promote Form */}
      <div className="admin-card" style={{ marginBottom: 16 }}>
        <div className="admin-card-header">
          <span className="admin-card-title">Add Admin</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="email"
            placeholder="user@email.com"
            value={promoteEmail}
            onChange={(e) => setPromoteEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handlePromote()}
            style={{
              background: '#1C1C1C', border: '1px solid #2A2A2A', borderRadius: 8,
              color: '#FFF', padding: '8px 12px', fontSize: 13, width: 300, outline: 'none',
            }}
          />
          <button
            className="admin-btn admin-btn-primary"
            onClick={handlePromote}
            disabled={promoting || !promoteEmail}
          >
            {promoting ? 'Promoting...' : 'Promote to Admin'}
          </button>
        </div>
        {error && (
          <div style={{ marginTop: 8, fontSize: 13, color: '#FF5252' }}>{error}</div>
        )}
        {success && (
          <div style={{ marginTop: 8, fontSize: 13, color: '#00E676' }}>{success}</div>
        )}
      </div>

      {/* Toolbar */}
      <div className="admin-toolbar">
        <div className="admin-filters">
          <input
            type="text"
            placeholder="Search admins..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              background: '#1C1C1C', border: '1px solid #2A2A2A', borderRadius: 8,
              color: '#FFF', padding: '8px 12px', fontSize: 13, width: 240, outline: 'none',
            }}
          />
        </div>
        <span style={{ fontSize: 13, color: '#666' }}>{filtered.length} admins</span>
      </div>

      {/* Admins Table */}
      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Added</th>
              <th>Last Active</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((admin) => {
              const rc = ROLE_CONFIG[admin.role] || ROLE_CONFIG.user;
              const isMe = admin.id === me?.id;
              return (
                <tr key={admin.id}>
                  <td>
                    <div className="user-cell">
                      <div className="user-avatar">{admin.name?.[0] || '?'}</div>
                      <div>
                        <div className="user-name">
                          {admin.name}
                          {isMe && <span style={{ fontSize: 11, color: '#666', marginLeft: 6 }}>(you)</span>}
                        </div>
                        <div className="user-email">{admin.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${rc.badge}`}>{rc.label}</span>
                  </td>
                  <td style={{ color: '#A0A0A0', fontSize: 13 }}>
                    {new Date(admin.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ color: '#A0A0A0', fontSize: 13 }}>
                    {admin.lastActiveAt
                      ? new Date(admin.lastActiveAt).toLocaleDateString()
                      : 'Never'}
                  </td>
                  <td>
                    {!isMe && admin.role !== 'super_admin' && (
                      <button
                        className="admin-btn admin-btn-danger admin-btn-sm"
                        onClick={() => handleDemote(admin.id, admin.name)}
                      >
                        Remove
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Role Legend */}
      <div style={{ marginTop: 16, padding: 16, background: '#141414', borderRadius: 12, border: '1px solid #1C1C1C' }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#A0A0A0', marginBottom: 12, textTransform: 'uppercase' }}>
          Role Permissions
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          <div>
            <span className="badge badge-purple" style={{ marginBottom: 8 }}>Super Admin</span>
            <ul style={{ fontSize: 12, color: '#666', marginTop: 8, paddingLeft: 16, lineHeight: 1.8 }}>
              <li>Full platform access</li>
              <li>Manage admin team</li>
              <li>Promote / demote admins</li>
              <li>All admin permissions</li>
            </ul>
          </div>
          <div>
            <span className="badge badge-green" style={{ marginBottom: 8 }}>Admin</span>
            <ul style={{ fontSize: 12, color: '#666', marginTop: 8, paddingLeft: 16, lineHeight: 1.8 }}>
              <li>View dashboard & analytics</li>
              <li>Manage users</li>
              <li>Review reports</li>
              <li>View payments</li>
            </ul>
          </div>
          <div>
            <span className="badge badge-gray" style={{ marginBottom: 8 }}>User</span>
            <ul style={{ fontSize: 12, color: '#666', marginTop: 8, paddingLeft: 16, lineHeight: 1.8 }}>
              <li>No admin access</li>
              <li>Regular app user</li>
              <li></li>
              <li></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
