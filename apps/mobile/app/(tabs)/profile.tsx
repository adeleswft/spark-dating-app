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
        <Text style={styles.title}>Profile</Text>
        <TouchableOpacity onPress={() => router.push('/edit-profile')} style={styles.editButton}>
          <MaterialCommunityIcons name="pencil" size={16} color="#E84855" />
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.profileHeader}>
        <View style={styles.avatar}><Text style={styles.avatarLetter}>{profile.name[0]}</Text></View>
        <View style={styles.profileInfo}>
          <View style={styles.nameRow}>
            <Text variant="headlineSmall" style={styles.name}>{profile.name}, {profile.age}</Text>
            {profile.verified && <MaterialCommunityIcons name="check-decagram" size={22} color="#E84855" />}
          </View>
          <Text variant="bodyMedium" style={styles.bio}>{profile.bio}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.consumableRow}>
          <TouchableOpacity style={styles.consumableCard} onPress={() => setShowBoostSheet(true)} activeOpacity={0.7}>
            <MaterialCommunityIcons name="flash" size={20} color="#D4A574" />
            <View style={styles.consumableInfo}>
              <Text style={styles.consumableCount}>{boostCount}</Text>
              <Text style={styles.consumableLabel}>Boosts</Text>
            </View>
            <View style={styles.buyBadge}>
              <MaterialCommunityIcons name="plus" size={13} color="#D4A574" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.consumableCard} onPress={() => setShowSuperLikeSheet(true)} activeOpacity={0.7}>
            <MaterialCommunityIcons name="star" size={20} color="#6C3A8A" />
            <View style={styles.consumableInfo}>
              <Text style={styles.consumableCount}>
                {superLikeCount === Infinity ? '∞' : superLikeCount}
              </Text>
              <Text style={styles.consumableLabel}>Super Sparks</Text>
            </View>
            <View style={styles.buyBadge}>
              <MaterialCommunityIcons name="plus" size={13} color="#6C3A8A" />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Interests</Text>
        <View style={styles.interestsContainer}>
          {profile.interests.map((interest) => (
            <Surface key={interest} style={styles.interestChip} elevation={0}>
              <Text style={styles.interestText}>{interest}</Text>
            </Surface>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Verification</Text>
        <Surface style={styles.verificationItem} elevation={0}>
          <MaterialCommunityIcons name="phone" size={22} color="#E84855" />
          <Text style={styles.verificationText}>Phone Verified ✓</Text>
        </Surface>
        <TouchableOpacity onPress={() => router.push('/verification')} activeOpacity={0.7}>
          <Surface style={styles.verificationItem} elevation={0}>
            <MaterialCommunityIcons name="camera" size={22} color={profile.photoVerified ? "#E84855" : "#5A5060"} />
            <View style={styles.verificationInfo}>
              <Text style={styles.verificationText}>Photo Verified {profile.photoVerified ? "✓" : "(Required)"}</Text>
              {!profile.photoVerified && <Text style={styles.verificationAction}>Tap to verify →</Text>}
            </View>
          </Surface>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/verification')} activeOpacity={0.7}>
          <Surface style={styles.verificationItem} elevation={0}>
            <MaterialCommunityIcons name="card-account-details" size={22} color={profile.idVerified ? "#E84855" : "#D4A574"} />
            <View style={styles.verificationInfo}>
              <Text style={styles.verificationText}>ID Verified {profile.idVerified ? "✓" : "(+100 boost points)"}</Text>
              {!profile.idVerified && <Text style={[styles.verificationAction, { color: '#D4A574' }]}>Tap to verify →</Text>}
            </View>
          </Surface>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.reviewCard} onPress={() => router.push('/profile-review')} activeOpacity={0.7}>
          <View style={styles.reviewCardContent}>
            <View style={styles.reviewIcon}><MaterialCommunityIcons name="brain" size={26} color="#FFF" /></View>
            <View style={styles.reviewInfo}>
              <Text style={styles.reviewTitle}>AI Profile Review</Text>
              <Text style={styles.reviewSubtitle}>Get personalized tips to boost your matches</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={22} color="#5A5060" />
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <TouchableOpacity onPress={() => router.push('/settings')} activeOpacity={0.7}>
          <Surface style={styles.settingsLink} elevation={0}>
            <View style={styles.settingsLinkLeft}>
              <MaterialCommunityIcons name="cog" size={20} color="#8A7E90" />
              <Text style={styles.settingsLinkText}>Settings</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#5A5060" />
          </Surface>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <TouchableOpacity onPress={() => router.push('/date-planner')} activeOpacity={0.7}>
          <Surface style={styles.datePlannerCard} elevation={0}>
            <MaterialCommunityIcons name="calendar-heart" size={26} color="#E84855" />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#F5EDE3' }}>AI Date Planner</Text>
              <Text style={{ fontSize: 12, color: '#8A7E90', marginTop: 2 }}>Get AI-suggested date ideas</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#5A5060" />
          </Surface>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <TouchableOpacity onPress={() => router.push('/subscription')} activeOpacity={0.7}>
          <Surface style={styles.premiumCard} elevation={0}>
            <MaterialCommunityIcons name="crown" size={28} color={isPremium ? '#E84855' : '#D4A574'} />
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
            <MaterialCommunityIcons name="chevron-right" size={20} color="#5A5060" />
          </Surface>
        </TouchableOpacity>
      </View>

      {isMock && (
        <View style={styles.section}>
          <View style={styles.devCard}>
            <MaterialCommunityIcons name="test-tube" size={14} color="#D4A574" />
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
                style={[styles.devButton, { backgroundColor: '#D4A57420' }]}
                onPress={() => useIAPStore.getState()._devSetBoostCount(boostCount + 5)}
              >
                <Text style={[styles.devButtonText, { color: '#D4A574' }]}>+5 Boosts</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.devButton, { backgroundColor: '#6C3A8A20' }]}
                onPress={() => useIAPStore.getState()._devSetSuperLikeCount(superLikeCount + 10)}
              >
                <Text style={[styles.devButtonText, { color: '#6C3A8A' }]}>+10 Sparks</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      <Button mode="outlined" onPress={() => logout()} style={styles.logoutButton} textColor="#E84855">Sign Out</Button>
      <View style={styles.footer}><Text style={styles.footerText}>Spark Dating App v1.0.0</Text></View>

      <ConsumablePurchaseSheet visible={showBoostSheet} type="boost" onClose={() => setShowBoostSheet(false)} />
      <ConsumablePurchaseSheet visible={showSuperLikeSheet} type="super_like" onClose={() => setShowSuperLikeSheet(false)} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0B0E' },
  header: { paddingTop: 60, paddingBottom: 16, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  editButton: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#1A1620', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14 },
  editButtonText: { color: '#E84855', fontSize: 13, fontWeight: '600' },
  datePlannerCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, backgroundColor: '#2A2530', gap: 12 },
  title: { fontSize: 26, fontWeight: '800', color: '#F5EDE3', letterSpacing: -0.5 },
  profileHeader: { flexDirection: 'row', padding: 16, backgroundColor: '#2A2530', marginBottom: 14, marginHorizontal: 12, borderRadius: 14 },
  avatar: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#3D1520', justifyContent: 'center', alignItems: 'center' },
  avatarLetter: { fontSize: 36, fontWeight: '800', color: '#E84855' },
  profileInfo: { flex: 1, marginLeft: 14, justifyContent: 'center' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontWeight: '700', color: '#F5EDE3' },
  bio: { color: '#8A7E90', marginTop: 6, lineHeight: 18 },
  section: { paddingHorizontal: 20, marginBottom: 14 },
  sectionTitle: { fontWeight: '700', color: '#F5EDE3', marginBottom: 10, fontSize: 15, letterSpacing: 0.2 },
  interestsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  interestChip: { backgroundColor: '#2A2530', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 18 },
  interestText: { color: '#D4A574', fontWeight: '600', fontSize: 13 },
  verificationItem: { flexDirection: 'row', alignItems: 'center', padding: 14, marginBottom: 6, borderRadius: 12, backgroundColor: '#2A2530', gap: 10 },
  verificationText: { flex: 1, fontSize: 15, color: '#F5EDE3' },
  verificationInfo: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  verificationAction: { fontSize: 12, color: '#E84855', fontWeight: '600' },
  reviewCard: { backgroundColor: '#2A2530', borderRadius: 14, overflow: 'hidden' },
  reviewCardContent: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  reviewIcon: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#E84855', justifyContent: 'center', alignItems: 'center' },
  reviewInfo: { flex: 1 },
  reviewTitle: { fontSize: 15, fontWeight: '700', color: '#F5EDE3' },
  reviewSubtitle: { fontSize: 12, color: '#8A7E90', marginTop: 2 },
  settingsLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderRadius: 12, backgroundColor: '#2A2530' },
  settingsLinkLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  settingsLinkText: { fontSize: 15, fontWeight: '600', color: '#F5EDE3' },

  consumableRow: { flexDirection: 'row', gap: 10 },
  consumableCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2530',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  consumableInfo: { flex: 1 },
  consumableCount: { fontSize: 18, fontWeight: '800', color: '#F5EDE3' },
  consumableLabel: { fontSize: 11, color: '#8A7E90', marginTop: 1 },
  buyBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#1A1620',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3D3545',
  },

  premiumCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, backgroundColor: '#2A2530', gap: 10 },
  premiumInfo: { flex: 1 },
  premiumTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  premiumTitle: { fontWeight: '700', color: '#F5EDE3' },
  premiumSubtitle: { color: '#8A7E90', marginTop: 3, fontSize: 12 },
  activeSubscriptionBadge: {
    backgroundColor: 'rgba(232, 72, 85, 0.15)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  activeSubscriptionText: { color: '#E84855', fontSize: 9, fontWeight: '800' },

  devCard: {
    backgroundColor: '#2A2530',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#D4A57430',
  },
  devText: { color: '#D4A574', fontSize: 12, fontWeight: '500', marginBottom: 8 },
  devButtons: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  devButton: {
    backgroundColor: '#E8485520',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  devButtonText: { color: '#E84855', fontSize: 11, fontWeight: '600' },

  logoutButton: { marginHorizontal: 20, marginBottom: 20, borderColor: '#E84855' },
  footer: { alignItems: 'center', paddingVertical: 16 },
  footerText: { color: '#5A5060', fontSize: 12 },
});
