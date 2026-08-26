import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

interface TypingDotsProps {
  color?: string;
  size?: number;
}

export default function TypingDots({ color = '#00E676', size = 6 }: TypingDotsProps) {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createBounce = (animValue: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(animValue, { toValue: -8, duration: 300, useNativeDriver: true }),
          Animated.timing(animValue, { toValue: 0, duration: 300, useNativeDriver: true }),
        ])
      );

    const animation = Animated.parallel([
      createBounce(dot1, 0),
      createBounce(dot2, 150),
      createBounce(dot3, 300),
    ]);

    animation.start();
    return () => animation.stop();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.dot, { backgroundColor: color, width: size, height: size, borderRadius: size / 2, transform: [{ translateY: dot1 }] }]} />
      <Animated.View style={[styles.dot, { backgroundColor: color, width: size, height: size, borderRadius: size / 2, transform: [{ translateY: dot2 }] }]} />
      <Animated.View style={[styles.dot, { backgroundColor: color, width: size, height: size, borderRadius: size / 2, transform: [{ translateY: dot3 }] }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot: {},
});
