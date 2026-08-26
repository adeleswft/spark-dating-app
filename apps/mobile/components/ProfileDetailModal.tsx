import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  Dimensions,
  ScrollView,
  Image,
  TouchableOpacity,
  StatusBar,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Text, Surface, IconButton, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ReportBlockModal from './ReportBlockModal';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import type { Profile } from './SwipeCard';
import { useScreenshotPrevention } from '../hooks/useScreenshotPrevention';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const PHOTO_HEIGHT = SCREEN_HEIGHT * 0.55;

interface ProfileDetailModalProps {
  visible: boolean;
  profile: Profile | null;
  onClose: () => void;
  onLike?: (profileId: string) => void;
  onPass?: (profileId: string) => void;
  onSuperLike?: (profileId: string) => void;
  authToken?: string;
}

function CompatibilityBar({
  label,
  score,
  color,
}: {
  label: string;
  score: number;
  color: string;
}) {
  const width = useSharedValue(0);

  React.useEffect(() => {
    width.value = withSpring(score, { damping: 20, stiffness: 100 });
  }, [score]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${interpolate(width.value, [0, 100], [0, 100], Extrapolation.CLAMP)}%`,
  }));

  return (
    <View style={styles.compatBar}>
      <View style={styles.compatBarHeader}>
        <Text style={styles.compatBarLabel}>{label}</Text>
        <Text style={styles.compatBarScore}>{Math.round(score)}%</Text>
      </View>
      <View style={styles.compatBarTrack}>
        <Animated.View style={[styles.compatBarFill, { backgroundColor: color }, animatedStyle]} />
      </View>
    </View>
  );
}

// Deterministic pseudo-random based on profile ID + seed
function seededFactors(score: number, seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
  }
  const rand = (min: number, max: number) => {
    h = (h * 1103515245 + 12345) & 0x7fffffff;
    return min + (h % (max - min + 1));
  };
  return {
    interests: Math.min(100, score + rand(-5, 10)),
    lifestyle: Math.min(100, score + rand(-10, 10)),
    communication: Math.min(100, score + rand(-5, 5)),
    values: Math.min(100, score + rand(-5, 10)),
    activity: Math.min(100, score + rand(-10, 10)),
  };
}

export default function ProfileDetailModal({
  visible,
  profile,
  onClose,
  onLike,
  onPass,
  onSuperLike,
  authToken,
}: ProfileDetailModalProps) {
  // Prevent screenshots while viewing someone's profile
  useScreenshotPrevention(visible);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setActivePhotoIndex(index);
  }, []);

  if (!profile) return null;

  // Generate stable compatibility breakdown from overall score + profile ID
  const factors = seededFactors(profile.compatibilityScore, profile.id);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <View style={styles.container}>
        {/* Photo Carousel */}
        <View style={styles.photoSection}>
          <FlatList
            data={profile.photos}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleScroll}
            keyExtractor={(_, i) => `photo-${i}`}
            renderItem={({ item }) => (
              <Image source={{ uri: item }} style={styles.photo} resizeMode="cover" />
            )}
          />

          {/* Photo indicators */}
          {profile.photos.length > 1 && (
            <View style={styles.photoIndicators}>
              {profile.photos.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.photoIndicator,
                    i === activePhotoIndex && styles.photoIndicatorActive,
                  ]}
                />
              ))}
            </View>
          )}

          {/* Close & Report buttons */}
          <View style={styles.topButtons}>
            <TouchableOpacity
              style={styles.reportButton}
              onPress={() => setShowReportModal(true)}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="flag-outline" size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.7}>
              <MaterialCommunityIcons name="close" size={28} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Name overlay with gradient */}
          <View style={styles.nameOverlay}>
            <View style={styles.nameGradient} />
            <View style={styles.nameOverlayContent}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{profile.name}, {profile.age}</Text>
              {profile.compatibilityScore >= 85 && (
                <View style={styles.topMatchBadge}>
                  <MaterialCommunityIcons name="fire" size={14} color="#fff" />
                  <Text style={styles.topMatchText}>Top Match</Text>
                </View>
              )}
            </View>
            <View style={styles.locationRow}>
              <MaterialCommunityIcons name="map-marker" size={16} color="rgba(255,255,255,0.8)" />
              <Text style={styles.distance}>{profile.distance}</Text>
            </View>
            </View>
          </View>
        </View>

        {/* Scrollable content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Compatibility score card */}
          <Surface style={styles.compatCard} elevation={2}>
            <View style={styles.compatHeader}>
              <MaterialCommunityIcons name="star" size={28} color="#00E676" />
              <Text style={styles.compatScore}>{profile.compatibilityScore}%</Text>
              <Text style={styles.compatLabel}>Match</Text>
            </View>
            <Text style={styles.compatReason}>{profile.compatibilityReason}</Text>

            <View style={styles.compatFactors}>
              <CompatibilityBar label="Shared Interests" score={factors.interests} color="#4CAF50" />
              <CompatibilityBar label="Lifestyle Match" score={factors.lifestyle} color="#2196F3" />
              <CompatibilityBar label="Communication" score={factors.communication} color="#FF9800" />
              <CompatibilityBar label="Core Values" score={factors.values} color="#9C27B0" />
              <CompatibilityBar label="Activity Level" score={factors.activity} color="#00E676" />
            </View>
          </Surface>

          {/* About */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About {profile.name}</Text>
            <Text style={styles.bio}>{profile.bio}</Text>
          </View>

          {/* Interests */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Interests</Text>
            <View style={styles.interestsGrid}>
              {profile.interests.map((interest) => (
                <Surface key={interest} style={styles.interestChip} elevation={1}>
                  <Text style={styles.interestText}>{interest}</Text>
                </Surface>
              ))}
            </View>
          </View>

          {/* Compatibility reason expanded */}
          <View style={styles.section}>
            <TouchableOpacity onPress={() => setExpanded(!expanded)} activeOpacity={0.7}>
              <View style={styles.expandRow}>
                <MaterialCommunityIcons name="brain" size={22} color="#00E676" />
                <Text style={styles.sectionTitle}>AI Match Analysis</Text>
                <MaterialCommunityIcons
                  name={expanded ? 'chevron-up' : 'chevron-down'}
                  size={22}
                  color="#999"
                />
              </View>
            </TouchableOpacity>
            {expanded && (
              <View style={styles.analysisCard}>
                <Text style={styles.analysisText}>
                  Based on your profiles, here's why Spark thinks you'd be great together:
                </Text>
                <Text style={styles.analysisText}>
                  🎯 You share {Math.floor(profile.compatibilityScore / 10)}+ common interests including{' '}
                  {profile.interests.slice(0, 3).join(', ')}.
                </Text>
                <Text style={styles.analysisText}>
                  💬 Your communication styles and activity levels are well-matched, suggesting
                  natural conversation flow.
                </Text>
                <Text style={styles.analysisText}>
                  🌟 Your complementary strengths create a dynamic where you can grow together while
                  enjoying shared passions.
                </Text>
              </View>
            )}
          </View>

          {/* Spacer for action buttons */}
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Action buttons — bottom bar */}
        <View style={styles.actionBar}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.passBtn]}
            onPress={() => onPass?.(profile.id)}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="close" size={28} color="#FF4444" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.superBtn]}
            onPress={() => onSuperLike?.(profile.id)}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="star" size={30} color="#6C63FF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.likeBtn]}
            onPress={() => onLike?.(profile.id)}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="heart" size={28} color="#4CAF50" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Report/Block Modal */}
      {profile && (
        <ReportBlockModal
          visible={showReportModal}
          profileName={profile.name}
          profileId={profile.id}
          authToken={authToken}
          onClose={() => setShowReportModal(false)}
          onReport={(reason, desc) => {
            setShowReportModal(false);
          }}
          onBlock={(id) => {
            setShowReportModal(false);
            onClose();
          }}
        />
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },

  // Photo section
  photoSection: {
    height: PHOTO_HEIGHT,
    backgroundColor: '#000',
  },
  photo: {
    width: SCREEN_WIDTH,
    height: PHOTO_HEIGHT,
  },
  photoIndicators: {
    position: 'absolute',
    top: 48,
    left: 16,
    right: 16,
    flexDirection: 'row',
    gap: 4,
  },
  photoIndicator: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  photoIndicatorActive: {
    backgroundColor: '#FFFFFF',
  },
  topButtons: {
    position: 'absolute',
    top: 48,
    right: 16,
    flexDirection: 'row',
    gap: 8,
    zIndex: 10,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reportButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nameOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 24,
  },
  nameGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    // Approximate gradient with a semi-transparent backdrop
    // since React Native doesn't support CSS linear-gradient
    borderBottomColor: 'rgba(0,0,0,0.7)',
    borderBottomWidth: 60,
  },
  nameOverlayContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 24,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  topMatchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 230, 118, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  topMatchText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  distance: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },

  // Content
  content: {
    flex: 1,
    backgroundColor: '#141414',
  },

  // Compatibility card
  compatCard: {
    margin: 16,
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#141414',
  },
  compatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  compatScore: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#00E676',
  },
  compatLabel: {
    fontSize: 18,
    color: '#555',
    marginLeft: 4,
  },
  compatReason: {
    fontSize: 15,
    color: '#E0E0E0',
    lineHeight: 22,
    marginBottom: 20,
  },
  compatFactors: {
    gap: 10,
  },
  compatBar: {
    gap: 4,
  },
  compatBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  compatBarLabel: {
    fontSize: 13,
    color: '#A0A0A0',
  },
  compatBarScore: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFF',
  },
  compatBarTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1C1C1C',
    overflow: 'hidden',
  },
  compatBarFill: {
    height: '100%',
    borderRadius: 3,
  },

  // Sections
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 10,
  },
  bio: {
    fontSize: 15,
    color: '#E0E0E0',
    lineHeight: 22,
  },

  // Interests
  interestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1C1C1C',
  },
  interestText: {
    fontSize: 14,
    color: '#E0E0E0',
  },

  // AI Analysis
  expandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  analysisCard: {
    backgroundColor: '#1C1C1C',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    gap: 10,
  },
  analysisText: {
    fontSize: 14,
    color: '#E0E0E0',
    lineHeight: 20,
  },

  // Action bar
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    paddingBottom: 36,
    gap: 24,
    backgroundColor: '#0A0A0A',
    borderTopWidth: 1,
    borderTopColor: '#1C1C1C',
  },
  actionBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#141414',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  passBtn: {
    borderWidth: 2,
    borderColor: '#FF4444',
  },
  superBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: '#6C63FF',
  },
  likeBtn: {
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
});
