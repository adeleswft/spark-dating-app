import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { safeStorage } from '../services/storage';
import type { SubscriptionTier, ConsumableType } from '../services/iapProducts';
import { getAllProductIds } from '../services/iapProducts';
import { useAuthStore } from './auth';

// ── Try to load react-native-iap ──────────────────────────────────
// Falls back to mock mode if the native module isn't available.
let RNIap: any = null;
try {
  RNIap = require('react-native-iap');
} catch {
  // Mock mode — purchases succeed locally but aren't real
}

const isMock = !RNIap;

// ── Types ─────────────────────────────────────────────────────────

interface PurchaseRecord {
  productId: string;
  transactionId: string;
  purchaseDate: number;
  receipt?: string;
}

export interface IAPState {
  // Subscription
  tier: SubscriptionTier;
  subscriptionExpiresAt: number | null;

  // Consumables
  boostCount: number;
  superLikeCount: number;

  // Purchase history
  purchaseHistory: PurchaseRecord[];

  // UI state
  isPurchasing: boolean;
  purchaseError: string | null;
  isRestoring: boolean;

  // Mock-mode flag (for dev/testing)
  isMock: boolean;

  // Actions
  purchaseSubscription: (productId: string) => Promise<boolean>;
  purchaseConsumable: (productId: string, quantity: number) => Promise<boolean>;
  restorePurchases: () => Promise<boolean>;
  consumeBoost: () => boolean;
  consumeSuperLike: () => boolean;
  setTier: (tier: SubscriptionTier, expiresAt?: number) => void;
  addBoosts: (count: number) => void;
  addSuperLikes: (count: number) => void;
  clearError: () => void;

  // Developer helpers
  _devSetBoostCount: (n: number) => void;
  _devSetSuperLikeCount: (n: number) => void;
  _devSetTier: (tier: SubscriptionTier) => void;
}

// ── Mock purchase logic ───────────────────────────────────────────

function mockPurchase(productId: string): PurchaseRecord {
  return {
    productId,
    transactionId: `mock-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    purchaseDate: Date.now(),
  };
}

function isSubscription(productId: string): boolean {
  return productId.includes('.plus.') || productId.includes('.elite.');
}

function subscriptionTierFromId(productId: string): SubscriptionTier {
  if (productId.includes('.elite.')) return 'spark_elite';
  if (productId.includes('.plus.')) return 'spark_plus';
  return 'free';
}

// ── Store ─────────────────────────────────────────────────────────

export const useIAPStore = create<IAPState>()(
  persist(
    (set, get) => ({
      tier: 'free',
      subscriptionExpiresAt: null,
      boostCount: 0,
      superLikeCount: 0,
      purchaseHistory: [],
      isPurchasing: false,
      purchaseError: null,
      isRestoring: false,
      isMock,

      purchaseSubscription: async (productId: string): Promise<boolean> => {
        set({ isPurchasing: true, purchaseError: null });

        try {
          if (isMock) {
            // Simulate 800ms network delay
            await new Promise((r) => setTimeout(r, 800));
            const record = mockPurchase(productId);
            const tier = subscriptionTierFromId(productId);
            set((s) => ({
              tier,
              subscriptionExpiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
              purchaseHistory: [record, ...s.purchaseHistory],
              isPurchasing: false,
              // Grant bonus consumables on subscription
              boostCount: s.boostCount + (tier === 'spark_elite' ? 5 : 1),
              // Use a large finite number instead of Infinity (Infinity doesn't survive JSON serialization)
              superLikeCount: tier === 'spark_elite' ? 9999 : s.superLikeCount + 5,
            }));
            return true;
          }

          // Real IAP flow (react-native-iap)
          if (RNIap?.initConnection) {
            await RNIap.initConnection();
            await RNIap.getProducts({ skus: [productId] });
            const result = await RNIap.requestPurchase({ sku: productId });
            if (result) {
              const record: PurchaseRecord = {
                productId,
                transactionId: result.transactionId || result.transactionId,
                purchaseDate: result.purchaseTime || Date.now(),
                receipt: result.purchaseToken,
              };
              const tier = subscriptionTierFromId(productId);
              set((s) => ({
                tier,
                subscriptionExpiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
                purchaseHistory: [record, ...s.purchaseHistory],
                isPurchasing: false,
                boostCount: s.boostCount + (tier === 'spark_elite' ? 5 : 1),
                // Use a large finite number instead of Infinity (Infinity doesn't survive JSON serialization)
                superLikeCount: tier === 'spark_elite' ? 9999 : s.superLikeCount + 5,
              }));
              // Acknowledge on Android
              if (RNIap?.finishTransaction) {
                await RNIap.finishTransaction({ purchase: result, isConsumable: false });
              }
              // Sync with our API
              try {
                const apiToken = useAuthStore.getState().token;
                if (apiToken) {
                  await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001'}/subscriptions`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      Authorization: `Bearer ${apiToken}`,
                    },
                    body: JSON.stringify({
                      planId: productId,
                      receipt: result.purchaseToken || '',
                    }),
                  });
                }
              } catch {
                // Non-critical — subscription works locally even if API sync fails
              }
              return true;
            }
          }

          set({ isPurchasing: false, purchaseError: 'Purchase was cancelled' });
          return false;
        } catch (e: any) {
          set({ isPurchasing: false, purchaseError: e?.message || 'Purchase failed' });
          return false;
        }
      },

      purchaseConsumable: async (productId: string, quantity: number): Promise<boolean> => {
        set({ isPurchasing: true, purchaseError: null });

        try {
          if (isMock) {
            await new Promise((r) => setTimeout(r, 600));
            const record = mockPurchase(productId);
            const isBoost = productId.includes('boost');
            set((s) => ({
              boostCount: isBoost ? s.boostCount + quantity : s.boostCount,
              superLikeCount: isBoost ? s.superLikeCount : s.superLikeCount + quantity,
              purchaseHistory: [record, ...s.purchaseHistory],
              isPurchasing: false,
            }));
            return true;
          }

          // Real IAP flow
          if (RNIap?.initConnection) {
            await RNIap.initConnection();
            await RNIap.getProducts({ skus: [productId] });
            const result = await RNIap.requestPurchase({ sku: productId });
            if (result) {
              const record: PurchaseRecord = {
                productId,
                transactionId: result.transactionId,
                purchaseDate: result.purchaseTime || Date.now(),
                receipt: result.purchaseToken,
              };
              const isBoost = productId.includes('boost');
              set((s) => ({
                boostCount: isBoost ? s.boostCount + quantity : s.boostCount,
                superLikeCount: isBoost ? s.superLikeCount : s.superLikeCount + quantity,
                purchaseHistory: [record, ...s.purchaseHistory],
                isPurchasing: false,
              }));
              if (RNIap?.finishTransaction) {
                await RNIap.finishTransaction({ purchase: result, isConsumable: true });
              }
              return true;
            }
          }

          set({ isPurchasing: false, purchaseError: 'Purchase was cancelled' });
          return false;
        } catch (e: any) {
          set({ isPurchasing: false, purchaseError: e?.message || 'Purchase failed' });
          return false;
        }
      },

      restorePurchases: async (): Promise<boolean> => {
        set({ isRestoring: true, purchaseError: null });

        try {
          if (isMock) {
            await new Promise((r) => setTimeout(r, 500));
            // In mock mode, nothing to restore
            set({ isRestoring: false });
            return true;
          }

          if (RNIap?.initConnection && RNIap?.getAvailablePurchases) {
            await RNIap.initConnection();
            const purchases = await RNIap.getAvailablePurchases();
            for (const p of purchases) {
              if (isSubscription(p.productId)) {
                set({ tier: subscriptionTierFromId(p.productId) });
              }
            }
            set({ isRestoring: false });
            return true;
          }

          set({ isRestoring: false });
          return true;
        } catch (e: any) {
          set({ isRestoring: false, purchaseError: e?.message || 'Restore failed' });
          return false;
        }
      },

      consumeBoost: () => {
        const { boostCount } = get();
        if (boostCount <= 0) return false;
        set({ boostCount: boostCount - 1 });
        return true;
      },

      consumeSuperLike: () => {
        const { superLikeCount } = get();
        if (superLikeCount <= 0) return false;
        set({ superLikeCount: superLikeCount - 1 });
        return true;
      },

      setTier: (tier, expiresAt) => {
        set({ tier, subscriptionExpiresAt: expiresAt ?? null });
      },

      addBoosts: (count) => set((s) => ({ boostCount: s.boostCount + count })),
      addSuperLikes: (count) => set((s) => ({ superLikeCount: s.superLikeCount + count })),
      clearError: () => set({ purchaseError: null }),

      // Dev helpers
      _devSetBoostCount: (n) => set({ boostCount: n }),
      _devSetSuperLikeCount: (n) => set({ superLikeCount: n }),
      _devSetTier: (tier) => set({ tier }),
    }),
    {
      name: 'spark-iap',
      storage: createJSONStorage(() => safeStorage),
      partialize: (state) => ({
        tier: state.tier,
        subscriptionExpiresAt: state.subscriptionExpiresAt,
        boostCount: state.boostCount,
        superLikeCount: state.superLikeCount,
        purchaseHistory: state.purchaseHistory.slice(0, 50), // keep last 50
      }),
    }
  )
);
