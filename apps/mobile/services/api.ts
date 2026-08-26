export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

interface ApiResponse<T> {
  data: T;
  error?: string;
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  setToken(token: string | null) {
    this.token = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const isFormData = options.body instanceof FormData;
    const headers: Record<string, string> = isFormData
      ? {} // Don't set Content-Type for FormData — runtime auto-generates the boundary
      : { 'Content-Type': 'application/json' };
    // Allow caller headers to override (e.g. multipart/form-data is now unnecessary but harmless)
    Object.assign(headers, options.headers as Record<string, string>);
    // Ensure we don't leak a manually-set multipart header without a boundary
    if (isFormData) {
      delete headers['Content-Type'];
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
      });

      if (!response.ok) {
        let errorMsg = `Request failed (${response.status})`;
        try {
          const error = await response.json();
          errorMsg = error.error || error.message || errorMsg;
        } catch {
          // Response body is not JSON (e.g. HTML from proxy/nginx)
        }
        return { data: null as T, error: errorMsg };
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      return { data: null as T, error: 'Network error' };
    }
  }

  // Auth
  async login(email: string, password: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(name: string, email: string, password: string, dob?: string, gender?: string) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, dob, gender }),
    });
  }

  async verifyPhone(phone: string, code: string) {
    return this.request('/auth/verify-phone', {
      method: 'POST',
      body: JSON.stringify({ phone, code }),
    });
  }

  // Profiles
  async getProfiles(filters?: any) {
    return this.request('/profiles', {
      method: 'POST',
      body: JSON.stringify(filters),
    });
  }

  async updateProfile(profile: any) {
    return this.request('/profiles', {
      method: 'PUT',
      body: JSON.stringify(profile),
    });
  }

  async uploadPhoto(uri: string) {
    const formData = new FormData();
    formData.append('photo', {
      uri,
      type: 'image/jpeg',
      name: 'photo.jpg',
    } as any);

    return this.request('/profiles/photos', {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  // Swipes
  async swipe(profileId: string, direction: 'left' | 'right' | 'super') {
    return this.request('/swipes', {
      method: 'POST',
      body: JSON.stringify({ profileId, direction }),
    });
  }

  // Matches
  async getMatches() {
    return this.request('/matches');
  }

  async getMatch(matchId: string) {
    return this.request(`/matches/${matchId}`);
  }

  // Messages
  async getMessages(matchId: string) {
    return this.request(`/messages/${matchId}`);
  }

  async sendMessage(matchId: string, content: string) {
    return this.request(`/messages/${matchId}`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }

  // Verification
  async requestPhotoVerification() {
    return this.request('/verification/photo', {
      method: 'POST',
    });
  }

  async submitPhotoVerification(selfieUri: string) {
    const formData = new FormData();
    formData.append('selfie', {
      uri: selfieUri,
      type: 'image/jpeg',
      name: 'selfie.jpg',
    } as any);

    return this.request('/verification/photo/submit', {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  async requestIdVerification() {
    return this.request('/verification/id', {
      method: 'POST',
    });
  }

  async submitIdVerification(frontUri: string, backUri?: string) {
    const formData = new FormData();
    formData.append('front', {
      uri: frontUri,
      type: 'image/jpeg',
      name: 'id-front.jpg',
    } as any);

    if (backUri) {
      formData.append('back', {
        uri: backUri,
        type: 'image/jpeg',
        name: 'id-back.jpg',
      } as any);
    }

    return this.request('/verification/id/submit', {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  // Subscriptions
  async getSubscriptionPlans() {
    return this.request('/subscriptions/plans');
  }

  async subscribe(planId: string, receipt: string) {
    return this.request('/subscriptions', {
      method: 'POST',
      body: JSON.stringify({ planId, receipt }),
    });
  }

  async getSubscription() {
    return this.request('/subscriptions');
  }
}

export const api = new ApiClient(API_BASE_URL);
