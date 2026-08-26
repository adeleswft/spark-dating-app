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
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

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
            setCurrentIndex(0); // Reset index when new profiles are loaded
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
        <Text variant="headlineMedium" style={styles.logo}>🔥 Spark</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.notificationBell} onPress={() => router.push('/notifications')} activeOpacity={0.7}>
            <MaterialCommunityIcons name="bell-outline" size={24} color="#A0A0A0" />
            {unreadCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <Surface style={styles.remainingBadge} elevation={0}>
            <MaterialCommunityIcons name="fire" size={16} color="#00E676" />
            <Text style={styles.remainingText}>{remainingCount}</Text>
          </Surface>
        </View>
      </View>

      <View style={styles.cardStack}>
        {loading ? (
          <View style={styles.emptyState}>
            <ActivityIndicator size="large" color="#00E676" />
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
            <MaterialCommunityIcons name="fire-off" size={64} color="#333" />
            <Text variant="headlineSmall" style={styles.emptyTitle}>No more profiles!</Text>
            <Text variant="bodyLarge" style={styles.emptySubtitle}>You've seen everyone nearby. Check back later for new matches!</Text>
          </View>
        )}
      </View>

      {hasProfiles && (
        <View style={styles.actions}>
          <IconButton icon="undo" size={22} iconColor={canRewind ? '#00E676' : '#555'} style={[styles.actionButton, styles.undoButton]} onPress={handleUndo} disabled={!canRewind} />
          <IconButton icon="close" size={32} iconColor="#FF5252" style={[styles.actionButton, styles.passButton]} onPress={() => handleButtonSwipe('left')} />
          <IconButton icon="star" size={26} iconColor="#7C4DFF" style={[styles.actionButton, styles.superButton]} onPress={handleSuperSpark} />
          <IconButton icon="heart" size={32} iconColor="#00E676" style={[styles.actionButton, styles.likeButton]} onPress={() => handleButtonSwipe('right')} />
          <IconButton icon="lightning-bolt" size={22} iconColor="#FFD600" style={[styles.actionButton, styles.boostButton]} onPress={() => setShowBoost(true)} />
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
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 56, paddingBottom: 12, paddingHorizontal: 20, backgroundColor: '#0A0A0A' },
  logo: { fontWeight: 'bold', color: '#00E676' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  notificationBell: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1C1C1C', position: 'relative' },
  notificationBadge: { position: 'absolute', top: 2, right: 2, backgroundColor: '#00E676', borderRadius: 8, minWidth: 16, height: 16, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4 },
  notificationBadgeText: { color: '#000', fontSize: 10, fontWeight: 'bold' },
  remainingBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1C1C1C', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 16, gap: 4 },
  remainingText: { fontWeight: 'bold', color: '#00E676', fontSize: 14 },
  cardStack: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 16 },
  actions: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 12, paddingBottom: 32, gap: 12 },
  actionButton: { backgroundColor: '#1C1C1C', elevation: 0 },
  undoButton: { width: 44, height: 44, borderRadius: 22, margin: 0 },
  passButton: { width: 64, height: 64, borderRadius: 32, margin: 0 },
  superButton: { width: 52, height: 52, borderRadius: 26, margin: 0 },
  likeButton: { width: 64, height: 64, borderRadius: 32, margin: 0 },
  boostButton: { width: 44, height: 44, borderRadius: 22, margin: 0 },
  emptyState: { alignItems: 'center', padding: 24 },
  emptyTitle: { marginTop: 16, fontWeight: 'bold', color: '#FFF' },
  emptySubtitle: { marginTop: 8, color: '#A0A0A0', textAlign: 'center' },
});
