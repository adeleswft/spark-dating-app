import { Hono } from 'hono';
import { db } from '../db';
import { verifications, verificationAttempts, users } from '../db/schema';
import { eq, and } from 'drizzle-orm';

export const verificationRoutes = new Hono();

// Request photo verification
verificationRoutes.post('/photo', async (c) => {
  // TODO: Add auth middleware
  const userId = (c as any).get('userId');

  // Check if already verified
  const existingVerification = await db.query.verifications.findFirst({
    where: and(
      eq(verifications.userId, userId),
      eq(verifications.type, 'photo'),
      eq(verifications.status, 'approved')
    ),
  });

  if (existingVerification) {
    return c.json({ message: 'Already photo verified' });
  }

  // Create verification request
  const [verification] = await db
    .insert(verifications)
    .values({
      userId,
      type: 'photo',
      status: 'pending',
    })
    .returning();

  return c.json({
    verificationId: verification.id,
    instructions: 'Take a selfie that matches your profile photos',
  });
});

// Submit photo verification
verificationRoutes.post('/photo/submit', async (c) => {
  // TODO: Add auth middleware
  const userId = (c as any).get('userId');

  // Handle selfie upload
  const body = await c.req.parseBody();
  const selfie = body['selfie'] as File;

  if (!selfie) {
    return c.json({ error: 'No selfie provided' }, 400);
  }

  // TODO: 
  // 1. Upload selfie to storage
  // 2. Run face detection and comparison with profile photos
  // 3. Check for liveness (head turn prompts)
  // 4. Store verification attempt

  // For demo, simulate verification
  const faceMatchScore = 0.92; // Simulated score

  // Create verification attempt
  const [attempt] = await db
    .insert(verificationAttempts)
    .values({
      userId,
      type: 'photo',
      status: faceMatchScore > 0.85 ? 'approved' : 'pending',
      faceMatchScore,
    })
    .returning();

  // If score is high enough, auto-approve
  if (faceMatchScore > 0.85) {
    // Update verification
    await db
      .update(verifications)
      .set({
        status: 'approved',
        verifiedAt: new Date(),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      })
      .where(and(
        eq(verifications.userId, userId),
        eq(verifications.type, 'photo')
      ));

    // Update user
    await db
      .update(users)
      .set({ photoVerified: true, updatedAt: new Date() })
      .where(eq(users.id, userId));

    return c.json({
      status: 'approved',
      message: 'Photo verification approved!',
      faceMatchScore,
    });
  }

  return c.json({
    status: 'pending',
    message: 'Verification submitted for review',
    faceMatchScore,
  });
});

// Request ID verification
verificationRoutes.post('/id', async (c) => {
  // TODO: Add auth middleware
  const userId = (c as any).get('userId');

  // Check if already verified
  const existingVerification = await db.query.verifications.findFirst({
    where: and(
      eq(verifications.userId, userId),
      eq(verifications.type, 'id'),
      eq(verifications.status, 'approved')
    ),
  });

  if (existingVerification) {
    return c.json({ message: 'Already ID verified' });
  }

  // Create verification request
  const [verification] = await db
    .insert(verifications)
    .values({
      userId,
      type: 'id',
      status: 'pending',
    })
    .returning();

  return c.json({
    verificationId: verification.id,
    instructions: 'Take a photo of your government-issued ID',
    incentive: 'Earn 100 boost points upon verification!',
  });
});

// Submit ID verification
verificationRoutes.post('/id/submit', async (c) => {
  // TODO: Add auth middleware
  const userId = (c as any).get('userId');

  // Handle ID upload
  const body = await c.req.parseBody();
  const front = body['front'] as File;
  const back = body['back'] as File | undefined;

  if (!front) {
    return c.json({ error: 'No ID photo provided' }, 400);
  }

  // TODO:
  // 1. Upload ID photos to storage
  // 2. Use third-party service (Onfido/MetaDoor) for ID verification
  // 3. Extract name, DOB, and validate against profile
  // 4. Check for tampering, expiration
  // 5. Store verification attempt

  // For demo, simulate verification
  const idExtractData = {
    name: 'Alex Johnson',
    dob: '1996-05-15',
    idType: 'drivers_license',
    expiryDate: '2028-05-15',
    isExpired: false,
    isTampered: false,
  };

  // Create verification attempt
  const [attempt] = await db
    .insert(verificationAttempts)
    .values({
      userId,
      type: 'id',
      status: 'pending',
      idExtractData,
    })
    .returning();

  // In production, this would be async webhook from verification provider
  // For demo, auto-approve
  await db
    .update(verifications)
    .set({
      status: 'approved',
      verifiedAt: new Date(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      data: idExtractData,
    })
    .where(and(
      eq(verifications.userId, userId),
      eq(verifications.type, 'id')
    ));

  // Update user
  await db
    .update(users)
    .set({ idVerified: true, updatedAt: new Date() })
    .where(eq(users.id, userId));

  // Check if fully verified (photo + id)
  const photoVerified = await db.query.verifications.findFirst({
    where: and(
      eq(verifications.userId, userId),
      eq(verifications.type, 'photo'),
      eq(verifications.status, 'approved')
    ),
  });

  if (photoVerified) {
    // Award fully verified status
    await db
      .update(users)
      .set({ verified: true, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  return c.json({
    status: 'approved',
    message: 'ID verification approved!',
    fullyVerified: !!photoVerified,
    incentive: photoVerified ? 'You earned 100 boost points!' : undefined,
  });
});
