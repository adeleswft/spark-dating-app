import React, { forwardRef, useImperativeHandle } from 'react';
import { View, StyleSheet, Dimensions, Image } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, interpolate, Extrapolation, runOnJS } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;
const ROTATION_FACTOR = 15;

export interface Profile { id: string; name: string; age: number; distance: string; bio: string; photos: string[]; compatibilityScore: number; compatibilityReason: string; interests: string[]; }

interface SwipeCardProps { profile: Profile; onSwipeLeft: () => void; onSwipeRight: () => void; onTap?: () => void; isFirst: boolean; stackIndex: number; }
export interface SwipeCardRef { triggerSwipe: (direction: 'left' | 'right') => void; }

const SwipeCard = forwardRef<SwipeCardRef, SwipeCardProps>(
  ({ profile, onSwipeLeft, onSwipeRight, onTap, isFirst, stackIndex }, ref) => {
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const cardScale = useSharedValue(1);
    const cardOpacity = useSharedValue(1);

    const triggerSwipe = (direction: 'left' | 'right') => {
      const targetX = direction === 'right' ? SCREEN_WIDTH * 1.5 : -SCREEN_WIDTH * 1.5;
      translateX.value = withTiming(targetX, { duration: 400 });
      translateY.value = withTiming(translateY.value + 100, { duration: 400 });
      cardOpacity.value = withTiming(0, { duration: 400 });
      if (direction === 'right') runOnJS(onSwipeRight)(); else runOnJS(onSwipeLeft)();
    };

    useImperativeHandle(ref, () => ({ triggerSwipe }));

    const panGesture = Gesture.Pan()
      .onUpdate((event) => { translateX.value = event.translationX; translateY.value = event.translationY * 0.5; })
      .onEnd((event) => {
        if (event.translationX > SWIPE_THRESHOLD) triggerSwipe('right');
        else if (event.translationX < -SWIPE_THRESHOLD) triggerSwipe('left');
        else { translateX.value = withSpring(0, { damping: 15, stiffness: 200 }); translateY.value = withSpring(0, { damping: 15, stiffness: 200 }); }
      });

    const tapGesture = Gesture.Tap().onEnd(() => { if (onTap) runOnJS(onTap)(); });
    const composed = Gesture.Race(panGesture, tapGesture);

    const likeOpacity = useAnimatedStyle(() => ({ opacity: interpolate(translateX.value, [0, SWIPE_THRESHOLD], [0, 1], Extrapolation.CLAMP) }));
    const nopeOpacity = useAnimatedStyle(() => ({ opacity: interpolate(translateX.value, [-SWIPE_THRESHOLD, 0], [1, 0], Extrapolation.CLAMP) }));
    const superOpacity = useAnimatedStyle(() => ({ opacity: interpolate(translateY.value, [-100, -30], [1, 0], Extrapolation.CLAMP) }));

    const cardAnimatedStyle = useAnimatedStyle(() => ({
      transform: [
        { translateX: translateX.value }, { translateY: translateY.value },
        { rotate: `${interpolate(translateX.value, [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2], [-ROTATION_FACTOR, 0, ROTATION_FACTOR], Extrapolation.CLAMP)}deg` },
        { scale: cardScale.value },
      ],
      opacity: cardOpacity.value,
    }));

    const stackStyle = useAnimatedStyle(() => ({
      transform: [
        { scale: interpolate(stackIndex, [0, 1, 2], [1, 0.95, 0.9], Extrapolation.CLAMP) },
        { translateY: interpolate(stackIndex, [0, 1, 2], [0, 10, 20], Extrapolation.CLAMP) },
      ],
      opacity: interpolate(stackIndex, [0, 1, 2], [1, 0.8, 0.6], Extrapolation.CLAMP),
    }));

    if (!isFirst && stackIndex > 2) return null;

    return (
      <Animated.View style={[styles.card, stackStyle, isFirst && cardAnimatedStyle]} pointerEvents={isFirst ? 'auto' : 'none'}>
        {isFirst ? (
          <GestureDetector gesture={composed}><CardInner profile={profile} /></GestureDetector>
        ) : (
          <CardInner profile={profile} />
        )}
        {isFirst && (
          <>
            <Animated.View style={[styles.indicator, styles.likeIndicator, likeOpacity]}>
              <Text style={[styles.indicatorText, { color: '#00E676' }]}>LIKE</Text>
            </Animated.View>
            <Animated.View style={[styles.indicator, styles.nopeIndicator, nopeOpacity]}>
              <Text style={[styles.indicatorText, { color: '#FF5252' }]}>NOPE</Text>
            </Animated.View>
            <Animated.View style={[styles.indicator, styles.superIndicator, superOpacity]}>
              <MaterialCommunityIcons name="star" size={32} color="#7C4DFF" />
              <Text style={[styles.indicatorText, { color: '#7C4DFF' }]}>SUPER</Text>
            </Animated.View>
          </>
        )}
      </Animated.View>
    );
  }
);

function CardInner({ profile }: { profile: Profile }) {
  return (
    <>
      <Image source={{ uri: profile.photos[0] }} style={styles.cardImage} />
      <View style={styles.cardOverlay}>
        <View style={styles.cardInfo}>
          <Text variant="headlineMedium" style={styles.cardName}>{profile.name}, {profile.age}</Text>
          <Text variant="bodyLarge" style={styles.cardDistance}>📍 {profile.distance}</Text>
          <Text variant="bodyMedium" style={styles.cardBio}>{profile.bio}</Text>
        </View>
        <Surface style={styles.compatibilityBadge} elevation={0}>
          <MaterialCommunityIcons name="star" size={20} color="#00E676" />
          <Text style={styles.compatibilityScore}>{profile.compatibilityScore}%</Text>
        </Surface>
        <View style={styles.interestsContainer}>
          {profile.interests.slice(0, 4).map((interest) => (
            <Surface key={interest} style={styles.interestChip} elevation={0}>
              <Text style={styles.interestText}>{interest}</Text>
            </Surface>
          ))}
          {profile.interests.length > 4 && <Surface style={styles.interestChip} elevation={0}><Text style={styles.interestText}>+{profile.interests.length - 4}</Text></Surface>}
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  card: { position: 'absolute', width: SCREEN_WIDTH - 32, height: SCREEN_HEIGHT * 0.6, borderRadius: 20, overflow: 'hidden', backgroundColor: '#141414', top: 0 },
  cardImage: { width: '100%', height: '100%' },
  cardOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)', padding: 20 },
  cardInfo: { marginBottom: 12 },
  cardName: { color: '#FFF', fontWeight: 'bold', textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  cardDistance: { color: 'rgba(255,255,255,0.9)', marginTop: 4, textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  cardBio: { color: 'rgba(255,255,255,0.9)', marginTop: 8, textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  compatibilityBadge: { position: 'absolute', top: 20, right: 20, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(20,20,20,0.9)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 4 },
  compatibilityScore: { fontWeight: 'bold', color: '#00E676', fontSize: 16 },
  interestsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  interestChip: { backgroundColor: 'rgba(20,20,20,0.85)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 16 },
  interestText: { fontSize: 12, color: '#E0E0E0' },
  indicator: { position: 'absolute', top: 40, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, borderWidth: 3, zIndex: 10 },
  likeIndicator: { left: 20, borderColor: '#00E676', transform: [{ rotate: '-20deg' }] },
  nopeIndicator: { right: 20, borderColor: '#FF5252', transform: [{ rotate: '20deg' }] },
  superIndicator: { left: '50%', marginLeft: -40, top: 20, flexDirection: 'row', alignItems: 'center', gap: 6, borderColor: '#7C4DFF' },
  indicatorText: { fontSize: 24, fontWeight: 'bold', letterSpacing: 2 },
});

export default SwipeCard;
