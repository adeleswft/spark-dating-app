import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Animated, Image } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface SuperLikeAnimationProps {
  visible: boolean;
  profileName: string;
  profilePhoto: string;
  onComplete: () => void;
}

// Star particle
function StarParticle({
  delay,
  startX,
  startY,
  size,
  emoji,
}: {
  delay: number;
  startX: number;
  startY: number;
  size: number;
  emoji: string;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  // Random burst direction
  const angle = Math.random() * Math.PI * 2;
  const distance = 150 + Math.random() * 200;
  const targetX = Math.cos(angle) * distance;
  const targetY = Math.sin(angle) * distance - 100; // bias upward

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.spring(translateX, {
          toValue: targetX,
          tension: 40,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: targetY,
          tension: 30,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.spring(scale, {
            toValue: 1.2,
            tension: 120,
            friction: 6,
            useNativeDriver: true,
          }),
          Animated.spring(scale, {
            toValue: 0,
            tension: 80,
            friction: 10,
            delay: 400,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.delay(500),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
        Animated.loop(
          Animated.timing(rotate, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          })
        ),
      ]),
    ]).start();
  }, []);

  return (
    <Animated.Text
      style={{
        position: 'absolute',
        left: startX - size / 2,
        top: startY - size / 2,
        fontSize: size,
        opacity,
        transform: [{ translateX }, { translateY }, { scale }, {
          rotate: rotate.interpolate({
            inputRange: [0, 1],
            outputRange: ['0deg', '360deg'],
          }),
        }],
      }}
    >
      {emoji}
    </Animated.Text>
  );
}

// Ring burst effect
function RingBurst({ delay }: { delay: number }) {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 0.6,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.ring,
        {
          opacity,
          transform: [{ scale }],
        },
      ]}
    />
  );
}

const STAR_EMOJIS = ['⭐', '✨', '💫', '🌟', '⚡', '✨', '💙', '🔮'];
const PARTICLE_COUNT = 24;

function createParticles(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    emoji: STAR_EMOJIS[Math.floor(Math.random() * STAR_EMOJIS.length)],
    delay: Math.random() * 300,
    startX: SCREEN_WIDTH / 2 + (Math.random() - 0.5) * 40,
    startY: SCREEN_HEIGHT / 2 + (Math.random() - 0.5) * 40,
    size: 16 + Math.random() * 20,
  }));
}

export default function SuperLikeAnimation({
  visible,
  profileName,
  profilePhoto,
  onComplete,
}: SuperLikeAnimationProps) {
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const starScale = useRef(new Animated.Value(0)).current;
  const starRotate = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(40)).current;
  const profileScale = useRef(new Animated.Value(0)).current;
  const particles = useRef(createParticles(PARTICLE_COUNT)).current;
  // Always hold the latest onComplete so the animation callback isn't stale
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (visible) {
      // Reset
      overlayOpacity.setValue(0);
      starScale.setValue(0);
      starRotate.setValue(0);
      textOpacity.setValue(0);
      textTranslateY.setValue(40);
      profileScale.setValue(0);

      // Animate
      Animated.sequence([
        // Fade in overlay
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),

        // Star burst in center
        Animated.parallel([
          Animated.spring(starScale, {
            toValue: 1,
            tension: 150,
            friction: 8,
            useNativeDriver: true,
          }),
          Animated.loop(
            Animated.timing(starRotate, {
              toValue: 1,
              duration: 2000,
              useNativeDriver: true,
            })
          ),
        ]),

        // Pop in profile photo
        Animated.spring(profileScale, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),

        // Show text
        Animated.parallel([
          Animated.timing(textOpacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.spring(textTranslateY, {
            toValue: 0,
            tension: 80,
            friction: 10,
            useNativeDriver: true,
          }),
        ]),

        // Hold, then dismiss
        Animated.delay(1500),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onCompleteRef.current();
      });
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>

      {/* Background gradient effect */}
      <View style={styles.gradientBg} />

      {/* Particle burst */}
      {particles.map((p) => (
        <StarParticle key={p.id} {...p} />
      ))}

      {/* Ring bursts */}
      <RingBurst delay={100} />
      <RingBurst delay={250} />
      <RingBurst delay={400} />

      {/* Center star */}
      <Animated.View
        style={[
          styles.centerStar,
          {
            transform: [
              { scale: starScale },
              {
                rotate: starRotate.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '360deg'],
                }),
              },
            ],
          },
        ]}
      >
        <Text style={styles.starEmoji}>⭐</Text>
      </Animated.View>

      {/* Profile photo */}
      <Animated.View style={[styles.profileContainer, { transform: [{ scale: profileScale }] }]}>
        <View style={styles.profileRing}>
          {profilePhoto ? (
            <Image source={{ uri: profilePhoto }} style={styles.profilePhoto} />
          ) : (
            <View style={styles.profilePlaceholder}>
              <Text style={styles.profilePlaceholderText}>👤</Text>
            </View>
          )}
        </View>
      </Animated.View>

      {/* Text */}
      <Animated.View
        style={[
          styles.textContainer,
          {
            opacity: textOpacity,
            transform: [{ translateY: textTranslateY }],
          },
        ]}
      >
        <Text style={styles.superLikeTitle}>Super Like!</Text>
        <Text style={styles.superLikeSubtitle}>
          You Super Liked {profileName}
        </Text>
        <Text style={styles.superLikeHint}>
          They'll see that you Super Liked them ⭐
        </Text>
      </Animated.View>

      {/* Bottom decorative stars */}
      <View style={styles.bottomStars}>
        <Text style={styles.decorStar}>✨</Text>
        <Text style={[styles.decorStar, styles.decorStarLarge]}>💙</Text>
        <Text style={styles.decorStar}>✨</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 200,
  },
  gradientBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(108, 99, 255, 0.95)', // Blue/purple tint for super like
  },

  // Ring bursts
  ring: {
    position: 'absolute',
    width: SCREEN_WIDTH * 0.7,
    height: SCREEN_WIDTH * 0.7,
    borderRadius: SCREEN_WIDTH * 0.35,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },

  // Center star
  centerStar: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.28,
  },
  starEmoji: {
    fontSize: 72,
  },

  // Profile
  profileContainer: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.38,
  },
  profileRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#6C63FF',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  profilePhoto: {
    width: 112,
    height: 112,
    borderRadius: 56,
  },
  profilePlaceholder: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profilePlaceholderText: {
    fontSize: 48,
  },

  // Text
  textContainer: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.56,
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  superLikeTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  superLikeSubtitle: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 10,
  },
  superLikeHint: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 8,
    textAlign: 'center',
  },

  // Bottom decoration
  bottomStars: {
    position: 'absolute',
    bottom: SCREEN_HEIGHT * 0.18,
    flexDirection: 'row',
    gap: 20,
    alignItems: 'center',
  },
  decorStar: {
    fontSize: 24,
    opacity: 0.6,
  },
  decorStarLarge: {
    fontSize: 40,
    opacity: 0.8,
  },
});
