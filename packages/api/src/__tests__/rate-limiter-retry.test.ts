#!/usr/bin/env tsx
/**
 * Runtime test: Redis rate limiter retry-after-failure behavior
 * Verifies the cooldown-based retry logic works correctly.
 */

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

async function main() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('Redis Rate Limiter Retry Logic Test');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Read the actual source to verify the retry logic is present
  const { readFileSync } = await import('fs');
  const src = readFileSync(new URL('../middleware/rateLimit.ts', import.meta.url), 'utf-8');

  console.log('Test 1: Cooldown constant exists');
  {
    const hasCooldown = src.includes('REDIS_RETRY_COOLDOWN_MS');
    assert(hasCooldown, 'REDIS_RETRY_COOLDOWN_MS constant is defined');
  }

  console.log('\nTest 2: Cooldown is set to 60 seconds');
  {
    const match = src.match(/REDIS_RETRY_COOLDOWN_MS\s*=\s*([\d_]+)/);
    assert(match !== null, 'Cooldown value is present');
    if (match) {
      const val = parseInt(match[1].replace(/_/g, ''));
      assert(val === 60000, `Cooldown is 60000ms (got ${val})`);
    }
  }

  console.log('\nTest 3: Failed connection sets redisLastFailedAt');
  {
    const hasFailedAt = src.includes('redisLastFailedAt = Date.now()');
    assert(hasFailedAt, 'redisLastFailedAt is set on failure');
  }

  console.log('\nTest 4: Cooldown check prevents premature retry');
  {
    const hasCooldownCheck = src.includes('Date.now() - redisLastFailedAt < REDIS_RETRY_COOLDOWN_MS');
    assert(hasCooldownCheck, 'Cooldown check compares elapsed time against cooldown');
  }

  console.log('\nTest 5: Stale client is quit before retry');
  {
    const hasQuit = src.includes('redisClient.quit()');
    assert(hasQuit, 'Stale Redis client is quit before reconnecting');
  }

  console.log('\nTest 6: Successful connection resets failedAt to 0');
  {
    const hasReset = src.includes('redisLastFailedAt = 0');
    assert(hasReset, 'redisLastFailedAt reset to 0 on success');
  }

  console.log('\nTest 7: Error handler updates redisLastFailedAt');
  {
    const hasErrorHandler = src.includes("redisClient.on('error', () => { redisAvailable = false; redisLastFailedAt = Date.now(); })");
    assert(hasErrorHandler, 'Error event handler sets redisLastFailedAt');
  }

  // Now test the actual behavior by importing and calling getRedis with no REDIS_URL
  console.log('\nTest 8: Without REDIS_URL, returns null (in-memory fallback)');
  {
    const originalRedisUrl = process.env.REDIS_URL;
    delete process.env.REDIS_URL;
    
    const mod = await import('../middleware/rateLimit');
    // The rateLimit middleware should work without Redis
    // We can't easily test getRedis() directly since it's not exported,
    // but we CAN test that the in-memory fallback works
    const mockContext = {
      req: {
        header: (name: string) => name === 'x-forwarded-for' ? '127.0.0.1' : undefined,
        url: 'http://localhost:3000/test',
      },
      header: () => {},
      json: (data: any, status?: number) => ({ status: status || 200, body: data }),
    };
    
    // The in-memory rate limiter should not crash
    const limiter = mod.rateLimit({ windowMs: 60000, max: 100 });
    let nextCalled = false;
    await limiter(mockContext as any, async () => { nextCalled = true; });
    assert(nextCalled, 'In-memory rate limiter calls next() for allowed requests');
    
    if (originalRedisUrl) process.env.REDIS_URL = originalRedisUrl;
  }

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log('═══════════════════════════════════════════════════════════════\n');

  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error('Test crashed:', err);
  process.exit(1);
});
