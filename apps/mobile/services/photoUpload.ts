import * as FileSystem from 'expo-file-system';
import { API_BASE_URL } from './api';

interface UploadResult {
  url: string;
  filename: string;
  success: boolean;
  error?: string;
}

/**
 * Upload a single photo to the server.
 * @param uri - Local file URI from ImagePicker
 * @param token - Auth JWT token
 * @returns The public URL of the uploaded photo
 */
export async function uploadPhoto(uri: string, token: string): Promise<UploadResult> {
  try {
    // Read the file as base64
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Determine MIME type from extension
    const ext = uri.split('.').pop()?.toLowerCase() || 'jpg';
    const mimeMap: Record<string, string> = {
      jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
      webp: 'image/webp', gif: 'image/gif',
    };
    const mimeType = mimeMap[ext] || 'image/jpeg';

    // Create form data
    const formData = new FormData();
    const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
    formData.append('photo', {
      uri,
      name: filename,
      type: mimeType,
    } as any);

    // Upload
    const response = await fetch(`${API_BASE_URL}/upload/photo`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Upload failed' }));
      return { url: '', filename: '', success: false, error: error.error };
    }

    const data = await response.json();
    return { url: data.url, filename: data.filename, success: true };
  } catch (e: any) {
    return { url: '', filename: '', success: false, error: e.message || 'Upload failed' };
  }
}

/**
 * Upload multiple photos to the server.
 * @param uris - Array of local file URIs
 * @param token - Auth JWT token
 * @returns Array of upload results
 */
export async function uploadPhotos(uris: string[], token: string): Promise<UploadResult[]> {
  const results: UploadResult[] = [];

  for (const uri of uris) {
    const result = await uploadPhoto(uri, token);
    results.push(result);
  }

  return results;
}

/**
 * Check if a URL is a local file URI (needs upload) or already a remote URL.
 */
export function isLocalUri(uri: string): boolean {
  return uri.startsWith('file://') || uri.startsWith('content://');
}

/**
 * Filter photos to separate local (need upload) from remote (already uploaded).
 */
export function separatePhotos(photos: string[]): { local: string[]; remote: string[] } {
  const local: string[] = [];
  const remote: string[] = [];

  for (const photo of photos) {
    if (isLocalUri(photo)) {
      local.push(photo);
    } else {
      remote.push(photo);
    }
  }

  return { local, remote };
}
