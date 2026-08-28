/**
 * Hook that prevents screenshots and screen recording.
 *
 * Uses expo-screen-capture to activate/deactivate screenshot blocking
 * when a screen mounts/unmounts. Shows a native warning when the user
 * attempts to capture the screen.
 *
 * Safe on web — gracefully no-ops when the native module isn't available.
 */
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

export function useScreenshotPrevention(prevent: boolean = true) {
  const isPreventing = useRef(false);

  useEffect(() => {
    if (Platform.OS === 'web') return;

    let ScreenCapture: any = null;
    try {
      ScreenCapture = require('expo-screen-capture');
    } catch {
      return;
    }
    if (!ScreenCapture) return;

    if (prevent && !isPreventing.current) {
      isPreventing.current = true;
      ScreenCapture.preventScreenCaptureAsync?.().catch(() => {});
    }

    return () => {
      if (isPreventing.current) {
        isPreventing.current = false;
        ScreenCapture.allowScreenCaptureAsync?.().catch(() => {});
      }
    };
  }, [prevent]);
}

export function useScreenshotListener(onCapture?: () => void) {
  useEffect(() => {
    if (Platform.OS === 'web' || !onCapture) return;

    let ScreenCapture: any = null;
    try {
      ScreenCapture = require('expo-screen-capture');
    } catch {
      return;
    }
    if (!ScreenCapture) return;

    const subscription = ScreenCapture.addScreenshotListener?.(() => {
      onCapture();
    });
    return () => {
      subscription?.remove?.();
    };
  }, [onCapture]);
}
