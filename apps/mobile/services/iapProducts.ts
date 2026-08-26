/**
 * In-App Purchase product definitions for Spark Dating App.
 *
 * Product IDs must match exactly what's configured in:
 *   - App Store Connect (iOS)
 *   - Google Play Console (Android)
 *
 * When running in development without react-native-iap installed,
 * the IAP store falls back to mock mode so the UI can be exercised.
 */

// ── Subscription tiers ────────────────────────────────────────────

export type SubscriptionTier = 'free' | 'spark_plus' | 'spark_elite';

export interface SubscriptionPlan {
  id: string;
  tier: SubscriptionTier;
  name: string;
  tagline: string;
  monthlyPrice: string;
  monthlyPriceCents: number;
  annualPrice: string;
  annualPriceCents: number;
  annualMonthlyEquivalent: string;
  discountPercent: number;
  features: string[];
  color: string; // accent color for the card
  badge?: string; // e.g. "MOST POPULAR"
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'com.spark.dating.free',
    tier: 'free',
    name: 'Free',
    tagline: 'Get started',
    monthlyPrice: '$0',
    monthlyPriceCents: 0,
    annualPrice: '$0',
    annualPriceCents: 0,
    annualMonthlyEquivalent: '$0',
    discountPercent: 0,
    features: [
      '10 curated matches/day',
      'Basic profile & messaging',
      'Standard filters',
      'AI compatibility scores',
    ],
    color: '#A0A0A0',
  },
  {
    id: 'com.spark.dating.plus.monthly',
    tier: 'spark_plus',
    name: 'Spark+',
    tagline: 'Most Popular',
    monthlyPrice: '$5.99',
    monthlyPriceCents: 599,
    annualPrice: '$50.39',
    annualPriceCents: 5039,
    annualMonthlyEquivalent: '$4.20',
    discountPercent: 30,
    features: [
      'Unlimited matches',
      'Advanced filters',
      'See who liked you',
      '5 Super Sparks/day',
      '1 weekly boost',
    ],
    color: '#00E676',
    badge: 'MOST POPULAR',
  },
  {
    id: 'com.spark.dating.elite.monthly',
    tier: 'spark_elite',
    name: 'Spark Elite',
    tagline: 'Maximum power',
    monthlyPrice: '$10.99',
    monthlyPriceCents: 1099,
    annualPrice: '$92.39',
    annualPriceCents: 9239,
    annualMonthlyEquivalent: '$7.70',
    discountPercent: 30,
    features: [
      'Everything in Spark+',
      'Priority profile placement',
      'Incognito mode',
      'AI Date Planner',
      'Message before matching',
      'Unlimited Super Sparks',
    ],
    color: '#7C4DFF',
  },
];

// ── Non-subscription products (consumables) ───────────────────────

export type ConsumableType = 'boost' | 'super_like';

export interface ConsumableProduct {
  id: string;
  type: ConsumableType;
  name: string;
  description: string;
  price: string;
  priceCents: number;
  quantity: number;
  icon: string;
  color: string;
}

export const CONSUMABLE_PRODUCTS: ConsumableProduct[] = [
  // Boosts
  {
    id: 'com.spark.dating.boost.1',
    type: 'boost',
    name: '1 Boost',
    description: '30 min of 10x visibility',
    price: '$2.99',
    priceCents: 299,
    quantity: 1,
    icon: 'flash',
    color: '#FFD600',
  },
  {
    id: 'com.spark.dating.boost.5',
    type: 'boost',
    name: '5 Boosts',
    description: '30 min each · Save 20%',
    price: '$11.99',
    priceCents: 1199,
    quantity: 5,
    icon: 'flash',
    color: '#FFD600',
  },
  {
    id: 'com.spark.dating.boost.10',
    type: 'boost',
    name: '10 Boosts',
    description: '30 min each · Save 33%',
    price: '$19.99',
    priceCents: 1999,
    quantity: 10,
    icon: 'flash',
    color: '#FFD600',
  },
  // Super Likes
  {
    id: 'com.spark.dating.superlike.5',
    type: 'super_like',
    name: '5 Super Sparks',
    description: 'Stand out from the crowd',
    price: '$3.99',
    priceCents: 399,
    quantity: 5,
    icon: 'star',
    color: '#7C4DFF',
  },
  {
    id: 'com.spark.dating.superlike.15',
    type: 'super_like',
    name: '15 Super Sparks',
    description: 'Best value · Save 25%',
    price: '$11.99',
    priceCents: 1199,
    quantity: 15,
    icon: 'star',
    color: '#7C4DFF',
  },
  {
    id: 'com.spark.dating.superlike.30',
    type: 'super_like',
    name: '30 Super Sparks',
    description: 'Maximum impact · Save 40%',
    price: '$19.99',
    priceCents: 1999,
    quantity: 30,
    icon: 'star',
    color: '#7C4DFF',
  },
];

// ── Helpers ───────────────────────────────────────────────────────

export function getPlanByTier(tier: SubscriptionTier): SubscriptionPlan {
  return SUBSCRIPTION_PLANS.find((p) => p.tier === tier) ?? SUBSCRIPTION_PLANS[0];
}

export function getProductsByType(type: ConsumableType): ConsumableProduct[] {
  return CONSUMABLE_PRODUCTS.filter((p) => p.type === type);
}

export function getAllProductIds(): string[] {
  return [
    ...SUBSCRIPTION_PLANS.filter((p) => p.tier !== 'free').map((p) => p.id),
    ...CONSUMABLE_PRODUCTS.map((p) => p.id),
  ];
}
