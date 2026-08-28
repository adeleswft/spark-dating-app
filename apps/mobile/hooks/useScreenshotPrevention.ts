/**
 * No-op web version — screenshot prevention is a native-only feature.
 */
import { useEffect } from 'react';

export function useScreenshotPrevention(_prevent: boolean = true) {
  // No-op on web
}

export function useScreenshotListener(_onCapture?: () => void) {
  // No-op on web
}
