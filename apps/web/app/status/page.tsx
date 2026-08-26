'use client';

import React, { useEffect, useState } from 'react';

interface ServiceStatus {
  name: string;
  status: 'healthy' | 'degraded' | 'down' | 'checking';
  latency?: number;
  message?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function checkService(name: string, url: string): Promise<ServiceStatus> {
  const start = Date.now();
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    const latency = Date.now() - start;
    if (res.ok) {
      return { name, status: 'healthy', latency };
    }
    return { name, status: 'degraded', latency, message: `HTTP ${res.status}` };
  } catch (e: any) {
    return { name, status: 'down', message: e.message || 'Connection failed' };
  }
}

export default function StatusPage() {
  const [services, setServices] = useState<ServiceStatus[]>([
    { name: 'API Server', status: 'checking' },
    { name: 'AI Service', status: 'checking' },
    { name: 'WebSocket', status: 'checking' },
    { name: 'Database', status: 'checking' },
  ]);

  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  async function checkAll() {
    setServices((prev) => prev.map((s) => ({ ...s, status: 'checking' as const })));

    const results = await Promise.all([
      checkService('API Server', `${API_URL}/health`),
      checkService('AI Service', 'http://localhost:8000/health'),
      checkService('WebSocket', `${API_URL}/health`),
      checkService('Database', `${API_URL}/health`),
    ]);

    setServices(results);
    setLastChecked(new Date());
  }

  useEffect(() => {
    checkAll();
    const interval = setInterval(checkAll, 30_000);
    return () => clearInterval(interval);
  }, []);

  const overallStatus = services.every((s) => s.status === 'healthy')
    ? 'healthy'
    : services.some((s) => s.status === 'down')
    ? 'down'
    : 'degraded';

  const statusColors: Record<string, string> = {
    healthy: '#00E676',
    degraded: '#FFD600',
    down: '#FF5252',
    checking: '#666',
  };

  const statusLabels: Record<string, string> = {
    healthy: 'Operational',
    degraded: 'Degraded',
    down: 'Down',
    checking: 'Checking...',
  };

  return (
    <main style={{ backgroundColor: '#0A0A0A', minHeight: '100vh', color: '#E0E0E0' }}>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '80px 24px 120px' }}>
        <div style={{ marginBottom: 48 }}>
          <a href="/" style={{ color: '#00E676', fontSize: 14, textDecoration: 'none', marginBottom: 24, display: 'inline-block' }}>
            ← Back to Spark
          </a>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: '#F0F0F0', marginBottom: 8 }}>
            System Status
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: statusColors[overallStatus] }} />
            <span style={{ color: statusColors[overallStatus], fontWeight: 600, fontSize: 15 }}>
              {statusLabels[overallStatus]}
            </span>
            {lastChecked && (
              <span style={{ color: '#555', fontSize: 12, marginLeft: 'auto' }}>
                Last checked: {lastChecked.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {services.map((service) => (
            <div
              key={service.name}
              style={{
                background: '#141414',
                borderRadius: 12,
                padding: '16px 20px',
                border: '1px solid #1C1C1C',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: statusColors[service.status],
                    animation: service.status === 'checking' ? 'pulse 1s infinite' : undefined,
                  }}
                />
                <span style={{ fontWeight: 600, fontSize: 14, color: '#F0F0F0' }}>{service.name}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {service.latency != null && (
                  <span style={{ fontSize: 12, color: '#666' }}>{service.latency}ms</span>
                )}
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: statusColors[service.status],
                    padding: '2px 10px',
                    borderRadius: 12,
                    background: `${statusColors[service.status]}15`,
                  }}
                >
                  {statusLabels[service.status]}
                </span>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={checkAll}
          style={{
            marginTop: 24,
            width: '100%',
            padding: 12,
            background: '#1C1C1C',
            border: '1px solid #2A2A2A',
            borderRadius: 10,
            color: '#A0A0A0',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          🔄 Refresh Status
        </button>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </main>
  );
}
