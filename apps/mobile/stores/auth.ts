import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { MMKV } from 'react-native-mmkv';
import { api } from '../services/api';
import { registerForPushNotifications, unregisterPushToken } from '../services/notifications';

const storage = new MMKV();

const mmkvStorage = {
  getItem: (name: string) => storage.getString(name) ?? null,
  setItem: (name: string, value: string) => storage.set(name, value),
  removeItem: (name: string) => storage.delete(name),
};

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  verified: boolean;
  photoVerified: boolean;
  idVerified: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string, dob?: string, gender?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ loading: true, error: null });
        try {
          const response = await api.login(email, password);
          if (response.error) {
            set({ loading: false, error: response.error });
            return false;
          }
          const { user, token } = response.data as { user: User; token: string };
          api.setToken(token);
          set({ user, token, isAuthenticated: true, loading: false });
          // Register push token with server after login
          registerForPushNotifications().catch(() => {});
          return true;
        } catch (err) {
          set({ loading: false, error: 'Network error. Please try again.' });
          return false;
        }
      },

      register: async (name: string, email: string, password: string, dob?: string, gender?: string) => {
        set({ loading: true, error: null });
        try {
          const response = await api.register(name, email, password, dob, gender);
          if (response.error) {
            set({ loading: false, error: response.error });
            return false;
          }
          const { user, token } = response.data as { user: User; token: string };
          api.setToken(token);
          set({ user, token, isAuthenticated: true, loading: false });
          // Register push token with server after registration
          registerForPushNotifications().catch(() => {});
          return true;
        } catch (err) {
          set({ loading: false, error: 'Network error. Please try again.' });
          return false;
        }
      },

      logout: async () => {
        // Unregister push token from server before clearing auth
        await unregisterPushToken().catch(() => {});
        api.setToken(null);
        set({ user: null, token: null, isAuthenticated: false, error: null });
      },

      setUser: (user: User) => {
        set({ user });
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'spark-auth',
      storage: createJSONStorage(() => mmkvStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => {
        return (state) => {
          // Restore token in API client after rehydration
          if (state?.token) {
            api.setToken(state.token);
          }
        };
      },
    }
  )
);
