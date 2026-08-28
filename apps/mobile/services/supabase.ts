import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Only create client if valid credentials are provided
let client: SupabaseClient;

if (SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_URL.startsWith('http')) {
  try {
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
  } catch (e) {
    console.warn('[Supabase] Failed to initialize:', e);
    client = createNoopClient();
  }
} else {
  console.warn('[Supabase] No valid SUPABASE_URL/SUPABASE_ANON_KEY — realtime features disabled');
  client = createNoopClient();
}

function createNoopClient(): SupabaseClient {
  return new Proxy({} as SupabaseClient, {
    get: (_target, prop) => {
      if (typeof prop === 'string' && prop.startsWith('_')) return undefined;
      return (...args: any[]) => ({
        data: null,
        error: null,
        select: () => ({ data: null, error: null }),
        insert: () => ({ data: null, error: null }),
        update: () => ({ data: null, error: null }),
        eq: () => ({ data: null, error: null }),
        single: () => ({ data: null, error: null }),
        channel: () => ({
          on: () => ({ subscribe: () => {} }),
          subscribe: () => {},
        }),
        removeChannel: () => {},
        getChannels: () => [],
      });
    },
  }) as SupabaseClient;
}

export const supabase = client;
