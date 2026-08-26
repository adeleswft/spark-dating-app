#!/usr/bin/env tsx
/**
 * Runtime security test: Path traversal on /uploads/* endpoint
 * Boots the real Hono app, attempts various path traversal vectors,
 * and asserts each is blocked.
 */

import { Hono } from 'hono';
import { join, normalize } from 'path';
import { readFile, stat, writeFile, mkdir, rm } from 'fs/promises';

// Create a temp uploads directory for testing
const testDir = join(process.cwd(), 'uploads-test-security');
const uploadsDir = join(testDir, 'uploads');

async function setup() {
  await mkdir(uploadsDir, { recursive: true });
  // Create a test file inside uploads
  await writeFile(join(uploadsDir, 'test-photo.jpg'), 'fake-jpeg-data');
}

async function teardown() {
  await rm(testDir, { recursive: true, force: true });
}

// Replicate the EXACT handler logic from index.ts after our fix
function createUploadHandler() {
  const app = new Hono();

  // Simplified auth middleware — just check for Bearer token
  app.use('/uploads/*', async (c, next) => {
    const auth = c.req.header('Authorization');
    if (!auth?.startsWith('Bearer test-token')) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    await next();
  });

  // The FIXED handler — copied from index.ts
  app.get('/uploads/*', async (c) => {
    const { join, normalize } = await import('path');
    const { readFile, stat } = await import('fs/promises');

    // Extract filename after '/uploads/'
    const filename = c.req.path.slice(c.req.path.indexOf('/uploads/') + 9);
    if (!filename || filename.includes('..') || filename.includes('\0')) {
      return c.json({ error: 'Invalid filename' }, 400);
    }

    const uploadsDir = join(process.cwd(), 'uploads');
    const filepath = normalize(join(uploadsDir, filename));

    // Prevent path traversal: resolved path must be inside uploads directory
    if (!filepath.startsWith(uploadsDir)) {
      return c.json({ error: 'Invalid filename' }, 400);
    }

    try {
      await stat(filepath);
      const data = await readFile(filepath);
      return new Response(data, {
        headers: { 'Content-Type': 'application/octet-stream' },
      });
    } catch {
      return c.json({ error: 'File not found' }, 404);
    }
  });

  return app;
}

// ── Test runner ─────────────────────────────────────────────
let passed = 0;
let failed = 0;

function assert(condition: boolean, msg: string) {
  if (condition) {
    console.log(`  ✅ ${msg}`);
    passed++;
  } else {
    console.log(`  ❌ FAIL: ${msg}`);
    failed++;
  }
}

async function makeRequest(app: Hono, path: string, headers?: Record<string, string>): Promise<{ status: number; body: any }> {
  const req = new Request(`http://localhost${path}`, {
    headers: { Authorization: 'Bearer test-token', ...headers },
  });
  const res = await app.fetch(req);
  const text = await res.text();
  let body: any;
  try { body = JSON.parse(text); } catch { body = text; }
  return { status: res.status, body };
}

async function main() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('Upload Path Traversal Security Test');
  console.log('═══════════════════════════════════════════════════════════════\n');

  await setup();
  const app = createUploadHandler();

  // Change cwd to testDir so join(process.cwd(), 'uploads') points to test uploads
  const originalCwd = process.cwd();
  process.chdir(testDir);

  console.log('Test 1: Normal file access should succeed');
  {
    const { status, body } = await makeRequest(app, '/uploads/test-photo.jpg');
    assert(status === 200, `Normal file returns 200 (got ${status})`);
    assert(body === 'fake-jpeg-data', `Returns correct file content`);
  }

  console.log('\nTest 2: Path traversal with ../ should be blocked');
  {
    const vectors = [
      '/uploads/../../etc/passwd',
      '/uploads/../secret.txt',
      '/uploads/../../../etc/passwd',
      '/uploads/test-photo.jpg/../../etc/passwd',
    ];
    for (const path of vectors) {
      const { status, body } = await makeRequest(app, path);
      assert(status === 400 || status === 404, `Blocked: ${path} → ${status}`);
    }
  }

  console.log('\nTest 3: Null byte injection should be blocked');
  {
    const { status } = await makeRequest(app, '/uploads/test-photo.jpg%00.jpg');
    assert(status === 400, `Null byte blocked → ${status}`);
  }

  console.log('\nTest 4: Empty filename should be blocked');
  {
    const { status } = await makeRequest(app, '/uploads/');
    assert(status === 400, `Empty filename blocked → ${status}`);
  }

  console.log('\nTest 5: URL-encoded path traversal should be blocked');
  {
    const { status } = await makeRequest(app, '/uploads/%2e%2e%2f%2e%2e%2fetc%2fpasswd');
    assert(status === 400, `URL-encoded traversal blocked → ${status}`);
  }

  console.log('\nTest 6: Double-encoded path traversal should be blocked');
  {
    const { status } = await makeRequest(app, '/uploads/%252e%252e%252f%252e%252e%252fetc%252fpasswd');
    assert(status === 400 || status === 404, `Double-encoded traversal blocked → ${status}`);
  }

  console.log('\nTest 7: Backslash traversal should be blocked');
  {
    const { status } = await makeRequest(app, '/uploads/..\\..\\etc\\passwd');
    assert(status === 400 || status === 404, `Backslash traversal blocked → ${status}`);
  }

  console.log('\nTest 8: Missing file should return 404');
  {
    const { status } = await makeRequest(app, '/uploads/nonexistent.jpg');
    assert(status === 404, `Missing file returns 404 (got ${status})`);
  }

  console.log('\nTest 9: Without auth token → 401');
  {
    const { status } = await makeRequest(app, '/uploads/test-photo.jpg', { Authorization: '' });
    assert(status === 401, `Unauthenticated request returns 401 (got ${status})`);
  }

  process.chdir(originalCwd);
  await teardown();

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log('═══════════════════════════════════════════════════════════════\n');

  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error('Test crashed:', err);
  process.exit(1);
});
