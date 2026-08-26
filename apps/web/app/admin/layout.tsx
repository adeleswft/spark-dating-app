'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { adminFetch, logoutAdmin } from '../../lib/api';
import './admin.css';

const NAV_ITEMS = [
  { href: '/admin', icon: '📊', label: 'Dashboard', exact: true },
  { href: '/admin/users', icon: '👥', label: 'Users' },
  { href: '/admin/reports', icon: '🚨', label: 'Reports' },
  { href: '/admin/analytics', icon: '📈', label: 'Analytics' },
  { href: '/admin/payments', icon: '💰', label: 'Payments' },
  { href: '/admin/team', icon: '🔑', label: 'Team', superAdminOnly: true },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [adminRole, setAdminRole] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('admin_role') || 'admin';
    }
    return 'admin';
  });
  const [checking, setChecking] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  // Skip auth check on login page
  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    if (isLoginPage) {
      setChecking(false);
      return;
    }
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/admin/login');
    } else {
      setAuthenticated(true);
      // Fetch admin role once on mount
      adminFetch('/me').then((data) => {
        const role = data.role || 'admin';
        setAdminRole(role);
        localStorage.setItem('admin_role', role);
      }).catch(() => {});
    }
    setChecking(false);
  }, [isLoginPage]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (checking) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0A0A0A',
        color: '#666',
      }}>
        Checking authentication...
      </div>
    );
  }

  if (!authenticated) {
    return null;
  }

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className={`admin-sidebar ${collapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          {!collapsed && <span className="sidebar-logo">⚡ Spark Admin</span>}
          {collapsed && <span className="sidebar-logo-collapsed">⚡</span>}
          <button className="sidebar-toggle" onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? '»' : '«'}
          </button>
        </div>

        <nav className="sidebar-nav">            {NAV_ITEMS.filter((item) => !item.superAdminOnly || adminRole === 'super_admin').map((item) => {
              const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`sidebar-link ${isActive ? 'active' : ''}`}
                  title={collapsed ? item.label : undefined}
                >
                  <span className="sidebar-icon">{item.icon}</span>
                  {!collapsed && <span className="sidebar-label">{item.label}</span>}
                </Link>
              );
            })}
        </nav>

        <div className="sidebar-footer">
          <Link href="/" className="sidebar-link">
            <span className="sidebar-icon">🏠</span>
            {!collapsed && <span className="sidebar-label">Back to Site</span>}
          </Link>
          <button
            className="sidebar-link"
            onClick={() => {
              logoutAdmin();
              router.push('/admin/login');
            }}
            style={{ cursor: 'pointer', background: 'none', border: 'none', width: '100%', textAlign: 'left' }}
          >
            <span className="sidebar-icon">🚪</span>
            {!collapsed && <span className="sidebar-label">Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="admin-main">
        <header className="admin-header">
          <div className="admin-header-left">
            <h1 className="admin-page-title">
              {NAV_ITEMS.find((i) => i.exact ? pathname === i.href : pathname.startsWith(i.href))?.label || 'Admin'}
            </h1>
          </div>
          <div className="admin-header-right">
            <div className="admin-search">
              <span className="search-icon">🔍</span>
              <input type="text" placeholder="Search..." className="search-input" />
            </div>
            <div className="admin-avatar">
              <span>A</span>
            </div>
          </div>
        </header>
        <div className="admin-content">
          {children}
        </div>
      </main>
    </div>
  );
}
