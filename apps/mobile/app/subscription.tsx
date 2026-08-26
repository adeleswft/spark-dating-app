import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useIAPStore } from '../stores/iap';
import {
  SUBSCRIPTION_PLANS,
  type SubscriptionPlan,
} from '../services/iapProducts';

export default function SubscriptionScreen() {
  const router = useRouter();
  const { tier, purchaseSubscription, isPurchasing, purchaseError, clearError, isMock } = useIAPStore();
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>(
    SUBSCRIPTION_PLANS.find((p) => p.tier === 'spark_plus')!
  );
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  const handlePurchase = useCallback(async () => {
    if (selectedPlan.tier === 'free') {
      Alert.alert('Free Plan', "You're already on the free plan!");
      return;
    }

    if (tier === selectedPlan.tier) {
      Alert.alert('Already Subscribed', `You're already on ${selectedPlan.name}!`);
      return;
    }

    const productId =
      billingCycle === 'annual'
        ? selectedPlan.id.replace('.monthly', '.annual')
        : selectedPlan.id;

    const success = await purchaseSubscription(productId);
    if (success) {
      Alert.alert(
        'Welcome to ' + selectedPlan.name + '! 🎉',
        'Your subscription is now active. Enjoy your new features!',
        [{ text: 'Start Exploring', onPress: () => router.back() }]
      );
    } else if (purchaseError) {
      Alert.alert('Purchase Failed', purchaseError);
      clearError();
    }
  }, [selectedPlan, billingCycle, tier, purchaseSubscription, purchaseError, clearError, router]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text variant="headlineSmall" style={styles.headerTitle}>Choose Your Plan</Text>
        <View style={{ width: 40 }} />
      </View>

      {isMock && (
        <View style={styles.mockBanner}>
          <MaterialCommunityIcons name="test-tube" size={16} color="#FFD600" />
          <Text style={styles.mockBannerText}>
            Dev Mode — Purchases are simulated
          </Text>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Billing Toggle */}
        {selectedPlan.tier !== 'free' && (
          <View style={styles.billingToggle}>
            <TouchableOpacity
              style={[styles.billingOption, billingCycle === 'monthly' && styles.billingActive]}
              onPress={() => setBillingCycle('monthly')}
            >
              <Text style={[styles.billingText, billingCycle === 'monthly' && styles.billingTextActive]}>
                Monthly
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.billingOption, billingCycle === 'annual' && styles.billingActive]}
              onPress={() => setBillingCycle('annual')}
            >
              <Text style={[styles.billingText, billingCycle === 'annual' && styles.billingTextActive]}>
                Annual
              </Text>
              <View style={styles.saveBadge}>
                <Text style={styles.saveBadgeText}>SAVE {selectedPlan.discountPercent}%</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Plan Cards */}
        {SUBSCRIPTION_PLANS.map((plan) => {
          const isSelected = selectedPlan.tier === plan.tier;
          const isCurrentTier = tier === plan.tier;
          const price =
            plan.tier === 'free'
              ? plan.monthlyPrice
              : billingCycle === 'annual'
              ? plan.annualMonthlyEquivalent
              : plan.monthlyPrice;

          return (
            <TouchableOpacity
              key={plan.tier}
              style={[
                styles.planCard,
                isSelected && { borderColor: plan.color, borderWidth: 2 },
                isCurrentTier && styles.planCardCurrent,
              ]}
              onPress={() => plan.tier !== 'free' && setSelectedPlan(plan)}
              activeOpacity={plan.tier === 'free' ? 1 : 0.7}
            >
              {plan.badge && (
                <View style={[styles.badge, { backgroundColor: plan.color }]}>
                  <Text style={styles.badgeText}>{plan.badge}</Text>
                </View>
              )}

              <View style={styles.planHeader}>
                <Text style={[styles.planName, { color: plan.color }]}>{plan.name}</Text>
                {isCurrentTier && (
                  <View style={styles.currentBadge}>
                    <Text style={styles.currentBadgeText}>CURRENT</Text>
                  </View>
                )}
              </View>

              <View style={styles.priceRow}>
                <Text style={styles.price}>{price}</Text>
                {plan.tier !== 'free' && (
                  <Text style={styles.pricePeriod}>/month</Text>
                )}
              </View>

              {plan.tier !== 'free' && billingCycle === 'annual' && (
                <Text style={styles.annualNote}>
                  Billed {plan.annualPrice}/year · {plan.annualMonthlyEquivalent}/mo
                </Text>
              )}

              {plan.tier !== 'free' && (
                <View style={styles.checkmark}>
                  <MaterialCommunityIcons
                    name={isSelected ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'}
                    size={22}
                    color={isSelected ? plan.color : '#555'}
                  />
                </View>
              )}

              <View style={styles.featuresList}>
                {plan.features.map((feature, i) => (
                  <View key={i} style={styles.featureRow}>
                    <MaterialCommunityIcons name="check" size={16} color={plan.color} />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>
            </TouchableOpacity>
          );
        })}

        {/* CTA Button */}
        <TouchableOpacity
          style={[
            styles.ctaButton,
            { backgroundColor: selectedPlan.color },
            isPurchasing && styles.ctaButtonDisabled,
          ]}
          onPress={handlePurchase}
          disabled={isPurchasing || selectedPlan.tier === 'free' || tier === selectedPlan.tier}
          activeOpacity={0.8}
        >
          {isPurchasing ? (
            <ActivityIndicator color={selectedPlan.tier === 'free' ? '#FFF' : '#000'} />
          ) : (
            <Text style={[styles.ctaText, { color: selectedPlan.tier === 'spark_plus' ? '#000' : '#FFF' }]}>
              {tier === selectedPlan.tier
                ? 'Current Plan'
                : selectedPlan.tier === 'free'
                ? 'Get Started Free'
                : `Subscribe — ${
                    billingCycle === 'annual'
                      ? selectedPlan.annualMonthlyEquivalent + '/mo'
                      : selectedPlan.monthlyPrice + '/mo'
                  }`}
            </Text>
          )}
        </TouchableOpacity>

        {/* Restore */}
        <TouchableOpacity style={styles.restoreButton} onPress={() => useIAPStore.getState().restorePurchases()}>
          <Text style={styles.restoreText}>Restore Purchases</Text>
        </TouchableOpacity>

        {/* Disclaimer */}
        <Text style={styles.disclaimer}>
          Subscriptions auto-renew unless cancelled at least 24 hours before the end of the current
          period. Payment will be charged to your account at confirmation of purchase. All purchases
          are final — no refunds will be issued.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 56,
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontWeight: 'bold', color: '#FFF' },
  mockBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2A2A00',
    paddingVertical: 8,
    gap: 6,
  },
  mockBannerText: { color: '#FFD600', fontSize: 13, fontWeight: '500' },
  content: { padding: 20, paddingBottom: 40 },
  billingToggle: {
    flexDirection: 'row',
    backgroundColor: '#1C1C1C',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  billingOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  billingActive: { backgroundColor: '#00E676' },
  billingText: { fontSize: 14, fontWeight: '600', color: '#A0A0A0' },
  billingTextActive: { color: '#000' },
  saveBadge: {
    backgroundColor: '#000',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  saveBadgeText: { color: '#00E676', fontSize: 10, fontWeight: '800' },
  planCard: {
    backgroundColor: '#141414',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  planCardCurrent: { opacity: 0.6 },
  badge: {
    position: 'absolute',
    top: -1,
    right: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  badgeText: { color: '#000', fontSize: 11, fontWeight: '800' },
  planHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  planName: { fontSize: 22, fontWeight: 'bold' },
  currentBadge: {
    backgroundColor: '#2A2A2A',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  currentBadgeText: { color: '#A0A0A0', fontSize: 11, fontWeight: '700' },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  price: { fontSize: 32, fontWeight: '900', color: '#FFF' },
  pricePeriod: { fontSize: 16, color: '#A0A0A0' },
  annualNote: { fontSize: 13, color: '#00E676', marginTop: 4 },
  checkmark: { position: 'absolute', top: 20, right: 20 },
  featuresList: { marginTop: 16, gap: 10 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featureText: { fontSize: 14, color: '#E0E0E0', flex: 1 },
  ctaButton: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  ctaButtonDisabled: { opacity: 0.5 },
  ctaText: { fontSize: 17, fontWeight: '700' },
  restoreButton: { alignItems: 'center', paddingVertical: 16 },
  restoreText: { color: '#A0A0A0', fontSize: 14 },
  disclaimer: {
    textAlign: 'center',
    color: '#555',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 8,
  },
});
