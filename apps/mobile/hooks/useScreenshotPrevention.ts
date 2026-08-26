/**
 * Hook that prevents screenshots and screen recording.
 *
 * Uses expo-screen-capture to activate/deactivate screenshot blocking
 * when a screen mounts/unmounts. Shows a native warning when the user
 * attempts to capture the screen.
 *
 * Usage:
 *   useScreenshotPrevention();                    // block on mount
 *   useScreenshotPrevention(true);                // explicitly block
 *   useScreenshotPrevention(false);               // explicitly allow
 */
import { useEffect, useRef } from 'react';
import * as ScreenCapture from 'expo-screen-capture';

export function useScreenshotPrevention(prevent: boolean = true) {
  const isPreventing = useRef(false);

  useEffect(() => {
    if (prevent && !isPreventing.current) {
      isPreventing.current = true;
      ScreenCapture.preventScreenCaptureAsync().catch(() => {
        // Some platforms may not support this
      });
    }

    return () => {
      if (isPreventing.current) {
        isPreventing.current = false;
        ScreenCapture.allowScreenCaptureAsync().catch(() => {});
      }
    };
  }, [prevent]);
}

/**
 * Listen for screenshot attempts (Android only).
 * Returns the listener subscription for cleanup.
 *
 * Usage:
 *   useScreenshotListener((event) => {
 *     Alert.alert('Screenshot Detected', 'Screenshots are not allowed.');
 *   });
 */
export function useScreenshotListener(
  onCapture?: () => void,
) {
  useEffect(() => {
    if (!onCapture) return;

    const subscription = ScreenCapture.addScreenshotListener(() => {
      onCapture();
    });
    return () => {
      subscription.remove();
    };
  }, [onCapture]);
}
