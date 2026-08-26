import { Hono } from 'hono';
import { writeFile } from 'fs/promises';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';

const UPLOAD_DIR = process.env.UPLOAD_DIR || join(process.cwd(), 'uploads');
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export const uploadRoutes = new Hono();

// Ensure upload directory exists (synchronous at startup)
if (!existsSync(UPLOAD_DIR)) {
  mkdirSync(UPLOAD_DIR, { recursive: true });
}

/**
 * POST /upload/photo
 * Upload a single photo. Returns the public URL.
 * Accepts multipart/form-data with a "photo" field.
 */
uploadRoutes.post('/photo', async (c) => {
  try {
    const body = await c.req.parseBody();
    const file = body['photo'];

    if (!file || typeof file === 'string') {
      return c.json({ error: 'No file provided. Send as multipart form-data with field "photo".' }, 400);
    }

    // file is a File object
    if (file.size > MAX_FILE_SIZE) {
      return c.json({ error: 'File too large. Maximum size is 10MB.' }, 400);
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return c.json({ error: `Invalid file type: ${file.type}. Allowed: ${ALLOWED_TYPES.join(', ')}` }, 400);
    }

    // Generate unique filename
    const ext = file.name.split('.').pop() || 'jpg';
    const filename = `${randomUUID()}.${ext}`;
    const filepath = join(UPLOAD_DIR, filename);

    // Write file
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await writeFile(filepath, buffer);

    // Return the URL
    const baseUrl = process.env.API_URL || `http://localhost:${process.env.PORT || 3001}`;
    const photoUrl = `${baseUrl}/uploads/${filename}`;

    return c.json({
      success: true,
      url: photoUrl,
      filename,
      size: file.size,
      type: file.type,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return c.json({ error: 'Failed to upload file' }, 500);
  }
});

/**
 * POST /upload/photos
 * Upload multiple photos at once.
 * Accepts multipart/form-data with "photos" field (array).
 */
uploadRoutes.post('/photos', async (c) => {
  try {
    const body = await c.req.parseBody();
    const files = body['photos'];

    if (!files) {
      return c.json({ error: 'No files provided.' }, 400);
    }

    // Normalize to array
    const fileArray = Array.isArray(files) ? files : [files];
    const results: { url: string; filename: string; error?: string }[] = [];
    const baseUrl = process.env.API_URL || `http://localhost:${process.env.PORT || 3001}`;

    for (const file of fileArray) {
      if (typeof file === 'string') {
        results.push({ url: '', filename: '', error: 'Invalid file' });
        continue;
      }

      if (file.size > MAX_FILE_SIZE) {
        results.push({ url: '', filename: '', error: 'File too large' });
        continue;
      }

      if (!ALLOWED_TYPES.includes(file.type)) {
        results.push({ url: '', filename: '', error: `Invalid type: ${file.type}` });
        continue;
      }

      try {
        const ext = file.name.split('.').pop() || 'jpg';
        const filename = `${randomUUID()}.${ext}`;
        const filepath = join(UPLOAD_DIR, filename);

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        await writeFile(filepath, buffer);

        results.push({
          url: `${baseUrl}/uploads/${filename}`,
          filename,
        });
      } catch (e) {
        results.push({ url: '', filename: '', error: 'Write failed' });
      }
    }

    const successCount = results.filter((r) => r.url).length;

    return c.json({
      success: successCount > 0,
      uploaded: successCount,
      total: fileArray.length,
      photos: results,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return c.json({ error: 'Failed to upload files' }, 500);
  }
});
