import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Animated, Image } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Props {
  visible: boolean;
  matchedName: string;
  matchedPhoto: string;
  myPhoto: string;
  onMessage: () => void;
  onKeepSwiping: () => void;
}

const HEART_EMOJIS = ['❤️', '💕', '💖', '💗', '💘', '💝', '✨', '🌟', '💫'];

function createParticles(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    emoji: HEART_EMOJIS[Math.floor(Math.random() * HEART_EMOJIS.length)],
    x: Math.random() * SCREEN_WIDTH,
    delay: Math.random() * 800,
    duration: 1500 + Math.random() * 2000,
    size: 16 + Math.random() * 24,
  }));
}

function Particle({ emoji, x, delay, duration, size }: { emoji: string; x: number; delay: number; duration: number; size: number }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-50)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          delay: duration - 500,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(translateY, {
          toValue: SCREEN_HEIGHT + 100,
          duration,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.delay(delay),
        Animated.loop(
          Animated.timing(rotate, {
            toValue: 1,
            duration: 1000,
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
        left: x,
        fontSize: size,
        opacity,
        transform: [
          { translateY },
          {
            rotate: rotate.interpolate({
              inputRange: [0, 1],
              outputRange: ['0deg', '360deg'],
            }),
          },
        ],
      }}
    >
      {emoji}
    </Animated.Text>
  );
}

export default function MatchCelebration({
  visible,
  matchedName,
  matchedPhoto,
  myPhoto,
  onMessage,
  onKeepSwiping,
}: Props) {
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const scaleProfileA = useRef(new Animated.Value(0)).current;
  const scaleProfileB = useRef(new Animated.Value(0)).current;
  const sparkleOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(30)).current;
  const particles = useRef(createParticles(30)).current;

  useEffect(() => {
    if (visible) {
      // Reset
      overlayOpacity.setValue(0);
      scaleProfileA.setValue(0);
      scaleProfileB.setValue(0);
      sparkleOpacity.setValue(0);
      textOpacity.setValue(0);
      textTranslateY.setValue(30);

      // Animate
      Animated.sequence([
        // Fade in overlay
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        // Pop in profiles
        Animated.parallel([
          Animated.spring(scaleProfileA, {
            toValue: 1,
            tension: 100,
            friction: 8,
            useNativeDriver: true,
          }),
          Animated.spring(scaleProfileB, {
            toValue: 1,
            tension: 100,
            friction: 8,
            delay: 200,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.delay(400),
            Animated.timing(sparkleOpacity, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
          ]),
        ]),
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
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
      {/* Particles */}
      {particles.map((p) => (
        <Particle key={p.id} {...p} />
      ))}

      {/* Sparkle bg */}
      <Animated.View style={[styles.sparkleBg, { opacity: sparkleOpacity }]}>
        <Text style={styles.sparkleEmoji}>✨</Text>
        <Text style={styles.sparkleEmoji}>🌟</Text>
        <Text style={styles.sparkleEmoji}>💫</Text>
      </Animated.View>

      {/* "It's a Match!" text */}
      <Animated.View
        style={[
          styles.matchTextContainer,
          {
            opacity: textOpacity,
            transform: [{ translateY: textTranslateY }],
          },
        ]}
      >
        <Text style={styles.matchTitle}>It's a Match!</Text>
        <Text style={styles.matchSubtitle}>
          You and {matchedName} liked each other
        </Text>
      </Animated.View>

      {/* Profile photos side by side */}
      <View style={styles.photosContainer}>
        <Animated.View style={[styles.photoWrapper, { transform: [{ scale: scaleProfileA }] }]}>
          <View style={styles.photoCircle}>
            {myPhoto ? (
              <Image source={{ uri: myPhoto }} style={styles.photoImage} />
            ) : (
              <Text style={styles.photoEmoji}>😊</Text>
            )}
          </View>
        </Animated.View>

        <Animated.View style={[styles.heartBetween, { transform: [{ scale: sparkleOpacity }] }]}>
          <MaterialCommunityIcons name="heart" size={40} color="#00E676" />
        </Animated.View>

        <Animated.View style={[styles.photoWrapper, { transform: [{ scale: scaleProfileB }] }]}>
          <View style={[styles.photoCircle, { borderColor: '#6C63FF' }]}>
            {matchedPhoto ? (
              <Image source={{ uri: matchedPhoto }} style={styles.photoImage} />
            ) : (
              <Text style={styles.photoEmoji}>🔥</Text>
            )}
          </View>
        </Animated.View>
      </View>

      {/* Action buttons */}
      <Animated.View style={[styles.buttonsContainer, { opacity: textOpacity }]}>
        <Button
          mode="contained"
          onPress={onMessage}
          style={styles.messageButton}
          labelStyle={styles.messageButtonLabel}
          icon="chat"
        >
          Send a Message
        </Button>
        <Button
          mode="outlined"
          onPress={onKeepSwiping}
          style={styles.keepSwipingButton}
          labelStyle={styles.keepSwipingButtonLabel}
        >
          Keep Swiping
        </Button>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 230, 118, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  sparkleBg: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sparkleEmoji: {
    fontSize: 60,
    position: 'absolute',
  },
  matchTextContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  matchTitle: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  matchSubtitle: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 8,
  },
  photosContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    marginBottom: 40,
  },
  photoWrapper: {},
  photoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 3,
    borderColor: '#00E676',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
  photoEmoji: {
    fontSize: 48,
  },
  heartBetween: {},
  buttonsContainer: {
    width: '80%',
    gap: 12,
  },
  messageButton: {
    backgroundColor: '#00E676',
    borderRadius: 30,
    paddingVertical: 4,
  },
  messageButtonLabel: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  },
  keepSwipingButton: {
    borderColor: 'rgba(255,255,255,0.5)',
    borderRadius: 30,
    paddingVertical: 4,
  },
  keepSwipingButtonLabel: {
    color: '#fff',
    fontSize: 16,
  },
});
