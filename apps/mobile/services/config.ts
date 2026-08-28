/**
 * Single source of truth for the API URL.
 * All screens and services should import from here instead of
 * declaring their own `const API_URL = ...`.
 */
export const API_URL =
  process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';
