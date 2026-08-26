'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { loginAdmin } from '../../../lib/api';
import '../admin.css';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      router.push('/admin');
    }
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await loginAdmin(email, password);
      router.push('/admin');
    } catch (e: any) {
      setError(e.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0A0A0A',
    }}>
      <div style={{
        background: '#141414',
        borderRadius: 16,
        padding: 40,
        width: 400,
        maxWidth: '90vw',
        border: '1px solid #1C1C1C',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>⚡</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#FFF', margin: 0 }}>Spark Admin</h1>
          <p style={{ fontSize: 13, color: '#666', marginTop: 8 }}>Sign in to manage your platform</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#A0A0A0', marginBottom: 6, textTransform: 'uppercase' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@spark.dating"
              required
              style={{
                width: '100%',
                background: '#1C1C1C',
                border: '1px solid #2A2A2A',
                borderRadius: 8,
                color: '#FFF',
                padding: '10px 14px',
                fontSize: 14,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#A0A0A0', marginBottom: 6, textTransform: 'uppercase' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{
                width: '100%',
                background: '#1C1C1C',
                border: '1px solid #2A2A2A',
                borderRadius: 8,
                color: '#FFF',
                padding: '10px 14px',
                fontSize: 14,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {error && (
            <div style={{
              background: '#FF525220',
              border: '1px solid #FF525240',
              borderRadius: 8,
              padding: '10px 14px',
              fontSize: 13,
              color: '#FF5252',
              marginBottom: 16,
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              background: loading ? '#333' : '#00E676',
              color: loading ? '#666' : '#000',
              border: 'none',
              borderRadius: 8,
              padding: '12px 0',
              fontSize: 14,
              fontWeight: 700,
              cursor: loading ? 'default' : 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <a href="/" style={{ fontSize: 13, color: '#666', textDecoration: 'none' }}>← Back to Spark</a>
        </div>
      </div>
    </div>
  );
}
