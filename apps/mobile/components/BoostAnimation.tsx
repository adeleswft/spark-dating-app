import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Animated, Image } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface BoostAnimationProps {
  visible: boolean;
  onComplete: () => void;
}

// Fire particle
function FireParticle({
  delay,
  size,
  emoji,
}: {
  delay: number;
  size: number;
  emoji: string;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0)).current;

  // Random burst from center-bottom area
  const startX = SCREEN_WIDTH / 2 + (Math.random() - 0.5) * 100;
  const startY = SCREEN_HEIGHT * 0.55;
  const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.8; // mostly upward
  const distance = 200 + Math.random() * 300;
  const targetX = Math.cos(angle) * distance;
  const targetY = Math.sin(angle) * distance;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.spring(translateX, {
          toValue: targetX,
          tension: 30,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.sequence([
          // Rise upward
          Animated.spring(translateY, {
            toValue: targetY,
            tension: 25,
            friction: 6,
            useNativeDriver: true,
          }),
          // Then drift down slightly (gravity)
          Animated.timing(translateY, {
            toValue: targetY + 80,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.spring(scale, {
            toValue: 1.3,
            tension: 120,
            friction: 6,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.delay(600),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
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
        transform: [{ translateX }, { translateY }, { scale }],
      }}
    >
      {emoji}
    </Animated.Text>
  );
}

// Rising flame from center
function RisingFlame({ delay }: { delay: number }) {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -SCREEN_HEIGHT * 0.4,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 0.7,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.delay(800),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.spring(scale, {
            toValue: 1.5,
            tension: 80,
            friction: 6,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 0.3,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        bottom: SCREEN_HEIGHT * 0.4,
        left: SCREEN_WIDTH / 2 - 30,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255, 152, 0, 0.3)',
        opacity,
        transform: [{ translateY }, { scale }],
      }}
    />
  );
}

const FIRE_EMOJIS = ['🔥', '🔥', '🔥', '💥', '⚡', '✨', '💫', '🌟', '🌋'];
const PARTICLE_COUNT = 30;

function createParticles(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    emoji: FIRE_EMOJIS[Math.floor(Math.random() * FIRE_EMOJIS.length)],
    delay: Math.random() * 400,
    size: 18 + Math.random() * 22,
  }));
}

export default function BoostAnimation({ visible, onComplete }: BoostAnimationProps) {
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const fireIconScale = useRef(new Animated.Value(0)).current;
  const fireIconRotate = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(40)).current;
  const statusOpacity = useRef(new Animated.Value(0)).current;
  const particles = useRef(createParticles(PARTICLE_COUNT)).current;

  useEffect(() => {
    if (visible) {
      // Reset
      overlayOpacity.setValue(0);
      fireIconScale.setValue(0);
      fireIconRotate.setValue(0);
      textOpacity.setValue(0);
      textTranslateY.setValue(40);
      statusOpacity.setValue(0);

      Animated.sequence([
        // Fade in overlay
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),

        // Fire icon burst
        Animated.parallel([
          Animated.spring(fireIconScale, {
            toValue: 1,
            tension: 150,
            friction: 8,
            useNativeDriver: true,
          }),
          Animated.loop(
            Animated.timing(fireIconRotate, {
              toValue: 1,
              duration: 3000,
              useNativeDriver: true,
            })
          ),
        ]),

        // Text fade in
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

        // Show status
        Animated.timing(statusOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),

        // Hold then dismiss
        Animated.delay(2000),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onComplete();
      });
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>

      {/* Dark gradient background */}
      <View style={styles.gradientBg} />

      {/* Rising flames */}
      <RisingFlame delay={200} />
      <RisingFlame delay={500} />
      <RisingFlame delay={800} />

      {/* Fire particles */}
      {particles.map((p) => (
        <FireParticle key={p.id} {...p} />
      ))}

      {/* Center fire icon */}
      <Animated.View
        style={[
          styles.centerIcon,
          {
            transform: [
              { scale: fireIconScale },
              {
                rotate: fireIconRotate.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '360deg'],
                }),
              },
            ],
          },
        ]}
      >
        <Text style={styles.fireEmoji}>🔥</Text>
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
        <Text style={styles.boostTitle}>Profile Boosted!</Text>
        <Text style={styles.boostSubtitle}>
          Your profile is now visible to more people
        </Text>
      </Animated.View>

      {/* Status card */}
      <Animated.View style={[styles.statusCard, { opacity: statusOpacity }]}>
        <View style={styles.statusRow}>
          <MaterialCommunityIcons name="eye" size={20} color="#FF9800" />
          <Text style={styles.statusText}>10x more profile views</Text>
        </View>
        <View style={styles.statusDivider} />
        <View style={styles.statusRow}>
          <MaterialCommunityIcons name="clock" size={20} color="#FF9800" />
          <Text style={styles.statusText}>Boost lasts 30 minutes</Text>
        </View>
        <View style={styles.statusDivider} />
        <View style={styles.statusRow}>
          <MaterialCommunityIcons name="trending-up" size={20} color="#4CAF50" />
          <Text style={styles.statusText}>Priority in discovery queue</Text>
        </View>
      </Animated.View>
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
    backgroundColor: 'rgba(20, 20, 20, 0.95)',
  },

  // Center icon
  centerIcon: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.3,
  },
  fireEmoji: {
    fontSize: 80,
  },

  // Text
  textContainer: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.48,
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  boostTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FF9800',
    textShadowColor: 'rgba(255, 152, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 12,
  },
  boostSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 8,
    textAlign: 'center',
  },

  // Status card
  statusCard: {
    position: 'absolute',
    bottom: SCREEN_HEIGHT * 0.18,
    width: SCREEN_WIDTH * 0.75,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 18,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 152, 0, 0.3)',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  statusDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
});
