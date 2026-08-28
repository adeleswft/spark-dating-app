import React, { useState, useRef, useCallback, useEffect } from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Text, IconButton, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import SwipeCard, { SwipeCardRef, Profile } from '../../components/SwipeCard';
import MatchCelebration from '../../components/MatchCelebration';
import ProfileDetailModal from '../../components/ProfileDetailModal';
import SuperLikeAnimation from '../../components/SuperLikeAnimation';
import BoostAnimation from '../../components/BoostAnimation';
import { useNotificationsStore } from '../../stores/notifications';
import { useNotificationActions } from '../../hooks/useNotifications';
import { useAuthStore } from '../../stores/auth';
import { useSwipeHistory } from '../../hooks/useSwipeHistory';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
import { API_URL } from '../../services/config';

// Fallback profiles when API is unreachable
const SAMPLE_PROFILES: Profile[] = [
  { id: '1', name: 'Sarah', age: 26, distance: '2 miles away', bio: 'Coffee enthusiast ☕ | Dog mom 🐕 | Weekend hiker', photos: ['https://picsum.photos/seed/sarah/400/600', 'https://picsum.photos/seed/sarah2/400/600', 'https://picsum.photos/seed/sarah3/400/600'], compatibilityScore: 89, compatibilityReason: 'You both love hiking and dogs. Your communication styles match well.', interests: ['Hiking', 'Coffee', 'Dogs', 'Photography'] },
  { id: '2', name: 'Emily', age: 24, distance: '5 miles away', bio: 'Artist 🎨 | Foodie 🍕 | Book lover 📚', photos: ['https://picsum.photos/seed/emily/400/600', 'https://picsum.photos/seed/emily2/400/600'], compatibilityScore: 76, compatibilityReason: 'Shared love for books and creative pursuits. Similar energy levels.', interests: ['Art', 'Cooking', 'Reading', 'Travel'] },
  { id: '3', name: 'Jessica', age: 27, distance: '3 miles away', bio: 'Yoga instructor 🧘 | Plant mom 🌿 | Travel addict ✈️', photos: ['https://picsum.photos/seed/jessica/400/600', 'https://picsum.photos/seed/jessica2/400/600', 'https://picsum.photos/seed/jessica3/400/600'], compatibilityScore: 82, compatibilityReason: 'Both value wellness and adventure. Great potential for meaningful connection.', interests: ['Yoga', 'Travel', 'Meditation', 'Plants', 'Nature'] },
  { id: '4', name: 'Mia', age: 25, distance: '7 miles away', bio: 'Software engineer by day 🖥️ | Amateur chef by night 🍳', photos: ['https://picsum.photos/seed/mia/400/600', 'https://picsum.photos/seed/mia2/400/600'], compatibilityScore: 71, compatibilityReason: 'You both appreciate creativity and problem-solving. Tech + food is a great combo.', interests: ['Technology', 'Cooking', 'Gaming', 'Podcasts'] },
  { id: '5', name: 'Luna', age: 23, distance: '1 mile away', bio: 'Musician 🎵 | Sunset chaser 🌅 | Dog person (obviously) 🐾', photos: ['https://picsum.photos/seed/luna/400/600', 'https://picsum.photos/seed/luna2/400/600', 'https://picsum.photos/seed/luna3/400/600'], compatibilityScore: 91, compatibilityReason: 'Exceptional match! Shared love for music, nature, and animals. High energy compatibility.', interests: ['Music', 'Photography', 'Dogs', 'Beach', 'Concerts'] },
];

export default function DiscoverScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showMatch, setShowMatch] = useState(false);
  const [matchedProfile, setMatchedProfile] = useState<Profile | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [showSuperLike, setShowSuperLike] = useState(false);
  const [superLikeProfile, setSuperLikeProfile] = useState<Profile | null>(null);
  const [showBoost, setShowBoost] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>(SAMPLE_PROFILES);
  const [loading, setLoading] = useState(true);
  const cardRefs = useRef<(SwipeCardRef | null)[]>([]);
  const router = useRouter();
  const unreadCount = useNotificationsStore((s) => s.unreadCount);
  const { onMatch, onSuperLike } = useNotificationActions();
  const { token } = useAuthStore();
  const { recordSwipe, rewindLast, canRewind } = useSwipeHistory();

  // Fetch profiles from API
  useEffect(() => {
    let cancelled = false;
    const fetchProfiles = async () => {
      try {
        const res = await fetch(`${API_URL}/profiles`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ minAge: 18, maxAge: 50, maxDistance: 50, genderPreference: [] }),
        });
        if (res.ok) {
          const data = await res.json();
          if (!cancelled && Array.isArray(data.profiles) && data.profiles.length > 0) {
            setProfiles(data.profiles);
            setCurrentIndex(0);
          }
        }
      } catch {
        // API unreachable, use sample data
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchProfiles();
    return () => { cancelled = true; };
  }, [token]);

  const visibleProfiles = profiles.slice(currentIndex, currentIndex + 3);

  const handleSwipeLeft = useCallback(() => {
    const profile = profiles[currentIndex];
    if (profile) {
      recordSwipe(profile, 'left');
      if (token) {
        fetch(`${API_URL}/swipes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ targetId: profile.id, direction: 'left' }),
        }).catch(() => {});
      }
    }
    setCurrentIndex((prev) => prev + 1);
  }, [currentIndex, profiles, token, recordSwipe]);

  const handleSwipeRight = useCallback(() => {
    const profile = profiles[currentIndex];
    if (profile) {
      recordSwipe(profile, 'right');
      if (token) {
        fetch(`${API_URL}/swipes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ targetId: profile.id, direction: 'right' }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data?.match) {
              setMatchedProfile(profile);
              onMatch(profile.name, profile.id);
              setTimeout(() => setShowMatch(true), 400);
            }
          })
          .catch(() => {
            if (currentIndex % 2 === 0) {
              setMatchedProfile(profile);
              onMatch(profile.name, profile.id);
              setTimeout(() => setShowMatch(true), 400);
            }
          });
      } else if (currentIndex % 2 === 0) {
        setMatchedProfile(profile);
        onMatch(profile.name, profile.id);
        setTimeout(() => setShowMatch(true), 400);
      }
    }
    setCurrentIndex((prev) => prev + 1);
  }, [currentIndex, profiles, token, onMatch, recordSwipe]);

  const handleButtonSwipe = (direction: 'left' | 'right') => { cardRefs.current[0]?.triggerSwipe(direction); };

  const [superLikeWillMatch, setSuperLikeWillMatch] = useState(false);

  const handleSuperSpark = () => {
    const profile = profiles[currentIndex];
    if (profile) {
      recordSwipe(profile, 'super');
      setSuperLikeProfile(profile);
      onSuperLike('You', profile.id);
      if (token) {
        fetch(`${API_URL}/swipes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ targetId: profile.id, direction: 'super' }),
        })
          .then((res) => res.json())
          .then((data) => { setSuperLikeWillMatch(!!data?.match); })
          .catch(() => { setSuperLikeWillMatch(currentIndex % 2 === 0); });
      } else {
        setSuperLikeWillMatch(currentIndex % 2 === 0);
      }
      setShowSuperLike(true);
    }
  };

  const handleSuperLikeComplete = useCallback(() => {
    setShowSuperLike(false);
    if (superLikeProfile && superLikeWillMatch) {
      setMatchedProfile(superLikeProfile);
      onMatch(superLikeProfile.name, superLikeProfile.id);
      setTimeout(() => setShowMatch(true), 200);
    }
    setCurrentIndex((prev) => prev + 1);
    setSuperLikeProfile(null);
    setSuperLikeWillMatch(false);
  }, [superLikeProfile, superLikeWillMatch, onMatch]);

  const handleUndo = useCallback(() => {
    const entry = rewindLast();
    if (entry) {
      setCurrentIndex((prev) => Math.max(0, prev - 1));
    }
  }, [rewindLast]);

  const hasProfiles = currentIndex < profiles.length;
  const remainingCount = Math.max(0, profiles.length - currentIndex);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.brandMark}>🔥</Text>
          <Text style={styles.logo}>Spark</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.notificationBell} onPress={() => router.push('/notifications')} activeOpacity={0.7}>
            <MaterialCommunityIcons name="bell-outline" size={22} color="#8A7E90" />
            {unreadCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <View style={styles.remainingBadge}>
            <MaterialCommunityIcons name="fire" size={14} color="#E84855" />
            <Text style={styles.remainingText}>{remainingCount}</Text>
          </View>
        </View>
      </View>

      <View style={styles.cardArea}>
        {/* Signature warm glow behind cards */}
        <View style={styles.glowContainer}>
          <View style={styles.glowOuter} />
          <View style={styles.glowInner} />
        </View>

        <View style={styles.cardStack}>
          {loading ? (
            <View style={styles.emptyState}>
              <ActivityIndicator size="large" color="#E84855" />
              <Text style={[styles.emptyTitle, { marginTop: 16 }]}>Finding your matches...</Text>
            </View>
          ) : hasProfiles ? (
            visibleProfiles.slice().reverse().map((profile, reversedIndex) => {
              const stackIndex = visibleProfiles.length - 1 - reversedIndex;
              const isFirst = stackIndex === 0;
              return (
                <SwipeCard key={profile.id} ref={(ref) => { if (isFirst) cardRefs.current[0] = ref; }} profile={profile} onSwipeLeft={handleSwipeLeft} onSwipeRight={handleSwipeRight} onTap={() => setSelectedProfile(profile)} isFirst={isFirst} stackIndex={stackIndex} />
              );
            })
          ) : (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="fire-off" size={56} color="#3D3545" />
              <Text style={styles.emptyTitle}>No more profiles!</Text>
              <Text style={styles.emptySubtitle}>You've seen everyone nearby. Check back later for new matches!</Text>
            </View>
          )}
        </View>
      </View>

      {hasProfiles && (
        <View style={styles.actions}>
          <IconButton icon="undo" size={20} iconColor={canRewind ? '#D4A574' : '#3D3545'} style={[styles.actionButton, styles.undoButton]} onPress={handleUndo} disabled={!canRewind} />
          <IconButton icon="close" size={30} iconColor="#E84855" style={[styles.actionButton, styles.passButton]} onPress={() => handleButtonSwipe('left')} />
          <IconButton icon="star" size={24} iconColor="#6C3A8A" style={[styles.actionButton, styles.superButton]} onPress={handleSuperSpark} />
          <IconButton icon="heart" size={30} iconColor="#E84855" style={[styles.actionButton, styles.likeButton]} onPress={() => handleButtonSwipe('right')} />
          <IconButton icon="lightning-bolt" size={20} iconColor="#D4A574" style={[styles.actionButton, styles.boostButton]} onPress={() => setShowBoost(true)} />
        </View>
      )}

      <ProfileDetailModal visible={!!selectedProfile} profile={selectedProfile} authToken={token ?? undefined} onClose={() => setSelectedProfile(null)} onLike={(id) => { const profile = profiles.find((p) => p.id === id); setSelectedProfile(null); if (profile) { recordSwipe(profile, 'right'); if (token) { fetch(`${API_URL}/swipes`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ targetId: profile.id, direction: 'right' }), }).then((res) => res.json()).then((data) => { if (data?.match) { setMatchedProfile(profile); onMatch(profile.name, profile.id); setTimeout(() => setShowMatch(true), 400); } }).catch(() => { if (currentIndex % 2 === 0) { setMatchedProfile(profile); onMatch(profile.name, profile.id); setTimeout(() => setShowMatch(true), 400); } }); } else if (currentIndex % 2 === 0) { setMatchedProfile(profile); onMatch(profile.name, profile.id); setTimeout(() => setShowMatch(true), 400); } } setCurrentIndex((prev) => prev + 1); }} onPass={() => { const profile = profiles.find((p) => p.id === selectedProfile?.id); setSelectedProfile(null); if (profile) { recordSwipe(profile, 'left'); if (token) { fetch(`${API_URL}/swipes`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ targetId: profile.id, direction: 'left' }), }).catch(() => {}); } } setCurrentIndex((prev) => prev + 1); }} onSuperLike={() => { const profile = profiles.find((p) => p.id === selectedProfile?.id); setSelectedProfile(null); if (profile) { recordSwipe(profile, 'super'); if (token) { fetch(`${API_URL}/swipes`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ targetId: profile.id, direction: 'super' }), }).catch(() => {}); } setSuperLikeProfile(profile); onSuperLike('You', profile.id); setShowSuperLike(true); } }} />

      <MatchCelebration visible={showMatch} matchedName={matchedProfile?.name || ''} matchedPhoto={matchedProfile?.photos[0] || ''} myPhoto="" onMessage={() => { setShowMatch(false); }} onKeepSwiping={() => setShowMatch(false)} />

      <SuperLikeAnimation visible={showSuperLike} profileName={superLikeProfile?.name || ''} profilePhoto={superLikeProfile?.photos[0] || ''} onComplete={handleSuperLikeComplete} />

      <BoostAnimation visible={showBoost} onComplete={() => setShowBoost(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0B0E' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 56, paddingBottom: 12, paddingHorizontal: 20 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  brandMark: { fontSize: 20 },
  logo: { fontSize: 22, fontWeight: '800', color: '#E84855', letterSpacing: -0.3 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  notificationBell: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1A1620', position: 'relative' },
  notificationBadge: { position: 'absolute', top: 2, right: 2, backgroundColor: '#E84855', borderRadius: 8, minWidth: 16, height: 16, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4 },
  notificationBadgeText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  remainingBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1A1620', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 14, gap: 4 },
  remainingText: { fontWeight: '700', color: '#E84855', fontSize: 13 },
  cardArea: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  glowContainer: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' },
  glowOuter: { width: 320, height: 380, borderRadius: 160, backgroundColor: 'rgba(232, 72, 85, 0.05)', position: 'absolute' },
  glowInner: { width: 220, height: 280, borderRadius: 120, backgroundColor: 'rgba(232, 72, 85, 0.04)', position: 'absolute' },
  cardStack: { width: SCREEN_WIDTH - 40, alignItems: 'center', justifyContent: 'center' },
  actions: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 10, paddingBottom: 28, gap: 14 },
  actionButton: { backgroundColor: '#1A1620', elevation: 0 },
  undoButton: { width: 44, height: 44, borderRadius: 22, margin: 0 },
  passButton: { width: 62, height: 62, borderRadius: 31, margin: 0, borderWidth: 2, borderColor: '#E8485530' },
  superButton: { width: 50, height: 50, borderRadius: 25, margin: 0, borderWidth: 2, borderColor: '#6C3A8A30' },
  likeButton: { width: 62, height: 62, borderRadius: 31, margin: 0, borderWidth: 2, borderColor: '#E8485530' },
  boostButton: { width: 44, height: 44, borderRadius: 22, margin: 0 },
  emptyState: { alignItems: 'center', padding: 24 },
  emptyTitle: { marginTop: 16, fontWeight: '700', color: '#F5EDE3', fontSize: 18 },
  emptySubtitle: { marginTop: 8, color: '#8A7E90', textAlign: 'center', fontSize: 14, lineHeight: 20 },
});
