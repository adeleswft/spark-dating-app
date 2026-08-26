const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function getToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('admin_token');
}

export async function adminFetch(path: string, options: RequestInit = {}): Promise<any> {
  const token = await getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}/admin${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(error.error || `HTTP ${res.status}`);
  }

  return res.json();
}

export async function loginAdmin(email: string, password: string): Promise<string> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    throw new Error('Login failed');
  }

  const data = await res.json();
  if (!data.user?.role || data.user.role === 'user') {
    throw new Error('Not an admin account');
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem('admin_token', data.token);
    localStorage.setItem('admin_role', data.user?.role || 'admin');
  }

  return data.token;
}

export function logoutAdmin(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('admin_token');
  }
}
