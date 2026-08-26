import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Button, Surface, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../stores/auth';
import { useIAPStore } from '../../stores/iap';
import ConsumablePurchaseSheet from '../../components/ConsumablePurchaseSheet';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

interface UserProfile {
  name: string;
  age: number;
  bio: string;
  photos: string[];
  interests: string[];
  verified: boolean;
  photoVerified: boolean;
  idVerified: boolean;
}

const FALLBACK_PROFILE: UserProfile = {
  name: 'Alex', age: 28, bio: 'Tech enthusiast 🚀 | Coffee lover ☕ | Weekend adventurer',
  photos: ['https://picsum.photos/seed/alex1/400/600', 'https://picsum.photos/seed/alex2/400/600', 'https://picsum.photos/seed/alex3/400/600'],
  interests: ['Technology', 'Hiking', 'Coffee', 'Photography', 'Travel'], verified: true, photoVerified: true, idVerified: false,
};

export default function ProfileScreen() {
  const { user, token, logout } = useAuthStore();
  const { tier, boostCount, superLikeCount, isMock } = useIAPStore();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile>(FALLBACK_PROFILE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchProfile = async () => {
      try {
        const res = await fetch(`${API_URL}/profiles/me`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          if (!cancelled && data.user) {
            const u = data.user;
            const age = u.dob ? Math.floor((Date.now() - new Date(u.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : 25;
            setProfile({
              name: u.name || 'User',
              age,
              bio: u.bio || '',
              photos: u.photos || [],
              interests: data.interests || [],
              verified: u.verified || false,
              photoVerified: u.photoVerified || false,
              idVerified: u.idVerified || false,
            });
          }
        }
      } catch {
        // Use fallback
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchProfile();
    return () => { cancelled = true; };
  }, [token]);
  const [showBoostSheet, setShowBoostSheet] = useState(false);
  const [showSuperLikeSheet, setShowSuperLikeSheet] = useState(false);

  const isPremium = tier === 'spark_plus' || tier === 'spark_elite';
  const tierName = tier === 'spark_elite' ? 'Spark Elite' : tier === 'spark_plus' ? 'Spark+' : 'Free';

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>Profile</Text>
        <TouchableOpacity onPress={() => router.push('/edit-profile')} style={styles.editButton}>
          <MaterialCommunityIcons name="pencil" size={18} color="#00E676" />
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.profileHeader}>
        <View style={styles.avatar}><Text style={styles.avatarLetter}>{profile.name[0]}</Text></View>
        <View style={styles.profileInfo}>
          <View style={styles.nameRow}>
            <Text variant="headlineSmall" style={styles.name}>{profile.name}, {profile.age}</Text>
            {profile.verified && <MaterialCommunityIcons name="check-decagram" size={24} color="#00E676" />}
          </View>
          <Text variant="bodyMedium" style={styles.bio}>{profile.bio}</Text>
        </View>
      </View>

      {/* Subscription & Consumables Row */}
      <View style={styles.section}>
        <View style={styles.consumableRow}>
          <TouchableOpacity style={styles.consumableCard} onPress={() => setShowBoostSheet(true)} activeOpacity={0.7}>
            <MaterialCommunityIcons name="flash" size={22} color="#FFD600" />
            <View style={styles.consumableInfo}>
              <Text style={styles.consumableCount}>{boostCount}</Text>
              <Text style={styles.consumableLabel}>Boosts</Text>
            </View>
            <View style={styles.buyBadge}>
              <MaterialCommunityIcons name="plus" size={14} color="#FFD600" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.consumableCard} onPress={() => setShowSuperLikeSheet(true)} activeOpacity={0.7}>
            <MaterialCommunityIcons name="star" size={22} color="#7C4DFF" />
            <View style={styles.consumableInfo}>
              <Text style={styles.consumableCount}>
                {superLikeCount === Infinity ? '∞' : superLikeCount}
              </Text>
              <Text style={styles.consumableLabel}>Super Sparks</Text>
            </View>
            <View style={styles.buyBadge}>
              <MaterialCommunityIcons name="plus" size={14} color="#7C4DFF" />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>Interests</Text>
        <View style={styles.interestsContainer}>
          {profile.interests.map((interest) => (
            <Surface key={interest} style={styles.interestChip} elevation={0}>
              <Text style={styles.interestText}>{interest}</Text>
            </Surface>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>Verification Status</Text>
        <Surface style={styles.verificationItem} elevation={0}>
          <MaterialCommunityIcons name="phone" size={24} color="#00E676" />
          <Text style={styles.verificationText}>Phone Verified ✓</Text>
        </Surface>
        <TouchableOpacity onPress={() => router.push('/verification')} activeOpacity={0.7}>        <Surface style={styles.verificationItem} elevation={0}>
          <MaterialCommunityIcons name="camera" size={24} color={profile.photoVerified ? "#00E676" : "#555"} />
          <View style={styles.verificationInfo}>
            <Text style={styles.verificationText}>Photo Verified {profile.photoVerified ? "✓" : "(Required)"}</Text>
            {!profile.photoVerified && <Text style={styles.verificationAction}>Tap to verify →</Text>}
          </View>
        </Surface>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/verification')} activeOpacity={0.7}>
          <Surface style={styles.verificationItem} elevation={0}>
            <MaterialCommunityIcons name="card-account-details" size={24} color={profile.idVerified ? "#00E676" : "#FFD600"} />
            <View style={styles.verificationInfo}>
              <Text style={styles.verificationText}>ID Verified {profile.idVerified ? "✓" : "(+100 boost points)"}</Text>
              {!profile.idVerified && <Text style={[styles.verificationAction, { color: '#FFD600' }]}>Tap to verify →</Text>}
            </View>
          </Surface>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.reviewCard} onPress={() => router.push('/profile-review')} activeOpacity={0.7}>
          <View style={styles.reviewCardContent}>
            <View style={styles.reviewIcon}><MaterialCommunityIcons name="brain" size={28} color="#000" /></View>
            <View style={styles.reviewInfo}>
              <Text style={styles.reviewTitle}>AI Profile Review</Text>
              <Text style={styles.reviewSubtitle}>Get personalized tips to boost your matches</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#555" />
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <TouchableOpacity onPress={() => router.push('/settings')} activeOpacity={0.7}>
          <Surface style={styles.settingsLink} elevation={0}>
            <View style={styles.settingsLinkLeft}>
              <MaterialCommunityIcons name="cog" size={22} color="#A0A0A0" />
              <Text style={styles.settingsLinkText}>Settings</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={22} color="#555" />
          </Surface>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <TouchableOpacity onPress={() => router.push('/date-planner')} activeOpacity={0.7}>
          <Surface style={styles.datePlannerCard} elevation={0}>
            <MaterialCommunityIcons name="calendar-heart" size={28} color="#00E676" />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#FFF' }}>AI Date Planner</Text>
              <Text style={{ fontSize: 13, color: '#A0A0A0', marginTop: 2 }}>Get AI-suggested date ideas</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={22} color="#555" />
          </Surface>
        </TouchableOpacity>
      </View>

      {/* Subscription Card */}
      <View style={styles.section}>
        <TouchableOpacity onPress={() => router.push('/subscription')} activeOpacity={0.7}>
          <Surface style={styles.premiumCard} elevation={0}>
            <MaterialCommunityIcons name="crown" size={32} color={isPremium ? '#00E676' : '#FFD600'} />
            <View style={styles.premiumInfo}>
              <View style={styles.premiumTitleRow}>
                <Text variant="titleMedium" style={styles.premiumTitle}>
                  {isPremium ? tierName : 'Upgrade to Spark+'}
                </Text>
                {isPremium && (
                  <View style={styles.activeSubscriptionBadge}>
                    <Text style={styles.activeSubscriptionText}>ACTIVE</Text>
                  </View>
                )}
              </View>
              <Text variant="bodySmall" style={styles.premiumSubtitle}>
                {isPremium
                  ? 'Unlimited matches, advanced filters, and more'
                  : 'Unlimited matches, see who liked you, and more'}
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={22} color="#555" />
          </Surface>
        </TouchableOpacity>
      </View>

      {isMock && (
        <View style={styles.section}>
          <View style={styles.devCard}>
            <MaterialCommunityIcons name="test-tube" size={16} color="#FFD600" />
            <Text style={styles.devText}>
              Dev Mode — Tap to unlock features
            </Text>
            <View style={styles.devButtons}>
              <TouchableOpacity
                style={styles.devButton}
                onPress={() => useIAPStore.getState()._devSetTier('spark_plus')}
              >
                <Text style={styles.devButtonText}>Spark+</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.devButton}
                onPress={() => useIAPStore.getState()._devSetTier('spark_elite')}
              >
                <Text style={styles.devButtonText}>Elite</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.devButton, { backgroundColor: '#FFD60020' }]}
                onPress={() => useIAPStore.getState()._devSetBoostCount(boostCount + 5)}
              >
                <Text style={[styles.devButtonText, { color: '#FFD600' }]}>+5 Boosts</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.devButton, { backgroundColor: '#7C4DFF20' }]}
                onPress={() => useIAPStore.getState()._devSetSuperLikeCount(superLikeCount + 10)}
              >
                <Text style={[styles.devButtonText, { color: '#7C4DFF' }]}>+10 Sparks</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      <Button mode="outlined" onPress={() => logout()} style={styles.logoutButton} textColor="#FF5252">Sign Out</Button>
      <View style={styles.footer}><Text variant="bodySmall" style={styles.footerText}>Spark Dating App v1.0.0</Text></View>

      {/* Purchase Sheets */}
      <ConsumablePurchaseSheet
        visible={showBoostSheet}
        type="boost"
        onClose={() => setShowBoostSheet(false)}
      />
      <ConsumablePurchaseSheet
        visible={showSuperLikeSheet}
        type="super_like"
        onClose={() => setShowSuperLikeSheet(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  header: { paddingTop: 60, paddingBottom: 16, paddingHorizontal: 20, backgroundColor: '#0A0A0A', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  editButton: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#141414', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  editButtonText: { color: '#00E676', fontSize: 13, fontWeight: '600' },
  datePlannerCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, backgroundColor: '#141414', gap: 14 },
  title: { fontWeight: 'bold', color: '#FFFFFF' },
  profileHeader: { flexDirection: 'row', padding: 20, backgroundColor: '#141414', marginBottom: 16, marginHorizontal: 12, borderRadius: 16 },
  avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#1B3A2A', justifyContent: 'center', alignItems: 'center' },
  avatarLetter: { fontSize: 40, fontWeight: 'bold', color: '#00E676' },
  profileInfo: { flex: 1, marginLeft: 16, justifyContent: 'center' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { fontWeight: 'bold', color: '#FFFFFF' },
  bio: { color: '#A0A0A0', marginTop: 8 },
  section: { paddingHorizontal: 20, marginBottom: 16 },
  sectionTitle: { fontWeight: 'bold', color: '#FFFFFF', marginBottom: 12 },
  interestsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  interestChip: { backgroundColor: '#1C1C1C', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  interestText: { color: '#00E676', fontWeight: '500' },
  verificationItem: { flexDirection: 'row', alignItems: 'center', padding: 16, marginBottom: 8, borderRadius: 12, backgroundColor: '#141414', gap: 12 },
  verificationText: { flex: 1, fontSize: 16, color: '#FFFFFF' },
  verificationInfo: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  verificationAction: { fontSize: 13, color: '#00E676', fontWeight: '500' },
  reviewCard: { backgroundColor: '#141414', borderRadius: 16, overflow: 'hidden' },
  reviewCardContent: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
  reviewIcon: { width: 52, height: 52, borderRadius: 14, backgroundColor: '#00E676', justifyContent: 'center', alignItems: 'center' },
  reviewInfo: { flex: 1 },
  reviewTitle: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF' },
  reviewSubtitle: { fontSize: 13, color: '#A0A0A0', marginTop: 2 },
  settingsLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 12, backgroundColor: '#141414' },
  settingsLinkLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingsLinkText: { fontSize: 16, fontWeight: '500', color: '#FFFFFF' },

  // Consumables row
  consumableRow: { flexDirection: 'row', gap: 12 },
  consumableCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141414',
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  consumableInfo: { flex: 1 },
  consumableCount: { fontSize: 20, fontWeight: '800', color: '#FFF' },
  consumableLabel: { fontSize: 12, color: '#A0A0A0', marginTop: 1 },
  buyBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1C1C1C',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },

  // Premium card
  premiumCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, backgroundColor: '#1C1C1C', gap: 12 },
  premiumInfo: { flex: 1 },
  premiumTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  premiumTitle: { fontWeight: 'bold', color: '#FFFFFF' },
  premiumSubtitle: { color: '#A0A0A0', marginTop: 4 },
  activeSubscriptionBadge: {
    backgroundColor: '#00E67620',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  activeSubscriptionText: { color: '#00E676', fontSize: 10, fontWeight: '800' },

  // Dev controls
  devCard: {
    backgroundColor: '#1C1C1C',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FFD60030',
  },
  devText: { color: '#FFD600', fontSize: 12, fontWeight: '500', marginBottom: 10 },
  devButtons: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  devButton: {
    backgroundColor: '#00E67620',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  devButtonText: { color: '#00E676', fontSize: 12, fontWeight: '600' },

  logoutButton: { marginHorizontal: 20, marginBottom: 20, borderColor: '#FF5252' },
  footer: { alignItems: 'center', paddingVertical: 20 },
  footerText: { color: '#555' },
});
