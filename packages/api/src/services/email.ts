import nodemailer from 'nodemailer';

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587', 10);
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const EMAIL_FROM = process.env.EMAIL_FROM || 'Spark <noreply@spark.dating>';
const NODE_ENV = process.env.NODE_ENV || 'development';

// ── Transporter (lazy init) ─────────────────────────────────────
let transporter: nodemailer.Transporter | null = null;
let transportMode: 'smtp' | 'console' = 'console';

function getTransporter(): nodemailer.Transporter {
  if (transporter) return transporter;

  if (SMTP_USER && SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
      // Connection pooling for production
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
    });
    transportMode = 'smtp';
    console.log(`✅ Email service: SMTP mode (${SMTP_HOST}:${SMTP_PORT})`);
  } else {
    transporter = nodemailer.createTransport({ jsonTransport: true });
    transportMode = 'console';
    console.log('⚠️  Email service: console-only mode (no SMTP credentials)');
  }

  return transporter;
}

// ── Email queue (in-memory, survives individual send failures) ───
interface QueuedEmail {
  id: string;
  to: string;
  subject: string;
  html: string;
  text?: string;
  attempts: number;
  maxAttempts: number;
  createdAt: number;
}

const emailQueue: QueuedEmail[] = [];
const MAX_QUEUE_SIZE = 100;
const MAX_RETRIES = 3;

// Process queue every 30 seconds
const queueInterval = setInterval(async () => {
  if (emailQueue.length === 0) return;

  const batch = emailQueue.splice(0, 5); // Process 5 at a time
  for (const email of batch) {
    try {
      await sendEmailDirect(email);
    } catch (err: any) {
      email.attempts++;
      if (email.attempts < email.maxAttempts) {
        emailQueue.push(email); // Re-queue
      } else {
        console.error(`❌ Email permanently failed after ${email.maxAttempts} attempts:`, email.id, err?.message || err);
      }
    }
  }
}, 30_000);

// Allow clean shutdown
process.on('SIGTERM', () => clearInterval(queueInterval));
process.on('SIGINT', () => clearInterval(queueInterval));

// ── Public API ──────────────────────────────────────────────────

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send an email. Falls back to console logging in development.
 * In production with SMTP, queues for reliability.
 */
export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  const transport = getTransporter();

  try {
    const info = await transport.sendMail({
      from: EMAIL_FROM,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    if (transportMode === 'console' && NODE_ENV !== 'production') {
      console.log('📧 Email sent (dev):', {
        to: options.to,
        subject: options.subject,
        messageId: info.messageId,
        preview: nodemailer.getTestMessageUrl(info) || '(no preview URL)',
        bodyLength: options.html?.length || 0,
      });
    }

    return true;
  } catch (error) {
    console.error('❌ Email send failed:', error);

    // In production, queue for retry
    if (transportMode === 'smtp' && emailQueue.length < MAX_QUEUE_SIZE) {
      const id = `email-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      emailQueue.push({
        id,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        attempts: 0,
        maxAttempts: MAX_RETRIES,
        createdAt: Date.now(),
      });
      console.log(`📥 Email queued for retry (${emailQueue.length} in queue)`);
    }

    return false;
  }
}

async function sendEmailDirect(email: QueuedEmail): Promise<void> {
  const transport = getTransporter();
  await transport.sendMail({
    from: EMAIL_FROM,
    to: email.to,
    subject: email.subject,
    html: email.html,
    text: email.text,
  });
}

// ── Escape HTML ─────────────────────────────────────────────────

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ── Password reset email ────────────────────────────────────────

export async function sendPasswordResetEmail(
  email: string,
  resetToken: string,
  userName: string
): Promise<boolean> {
  const safeName = escapeHtml(userName);
  const resetUrl = `${process.env.APP_URL || 'http://localhost:3000'}/reset-password?token=${encodeURIComponent(resetToken)}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #00E676; margin-bottom: 5px;">🔥 Spark</h1>
      </div>

      <h2 style="color: #333;">Reset Your Password</h2>

      <p>Hi ${safeName},</p>

      <p>We received a request to reset your password. Click the button below to create a new password:</p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}"
           style="background-color: #00E676; color: #1a1a1a; padding: 14px 28px;
                  text-decoration: none; border-radius: 8px; font-weight: 600;
                  display: inline-block;">
          Reset Password
        </a>
      </div>

      <p style="color: #666; font-size: 14px;">
        This link will expire in <strong>1 hour</strong>.
      </p>

      <p style="color: #666; font-size: 14px;">
        If you didn't request a password reset, you can safely ignore this email.
        Your password will not be changed unless you click the link above.
      </p>

      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

      <p style="color: #999; font-size: 12px; text-align: center;">
        © ${new Date().getFullYear()} Spark Dating App. All rights reserved.
      </p>
    </body>
    </html>
  `;

  const text = `Reset Your Password\n\nHi ${userName},\n\nWe received a request to reset your password.\n\nReset link: ${resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you didn't request this, you can ignore this email.`;

  return sendEmail({
    to: email,
    subject: 'Reset Your Spark Password',
    html,
    text,
  });
}

// ── Match notification email ────────────────────────────────────

export async function sendMatchEmail(
  email: string,
  userName: string,
  matchedName: string,
): Promise<boolean> {
  const safeName = escapeHtml(userName);
  const safeMatch = escapeHtml(matchedName);

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #00E676;">🔥 Spark</h1>
      </div>
      <h2 style="color: #333;">It's a Match! 💕</h2>
      <p>Hi ${safeName},</p>
      <p>You and <strong>${safeMatch}</strong> liked each other! Open the app to start chatting.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.APP_URL || 'http://localhost:3000'}"
           style="background-color: #00E676; color: #1a1a1a; padding: 14px 28px;
                  text-decoration: none; border-radius: 8px; font-weight: 600;
                  display: inline-block;">
          Open Spark
        </a>
      </div>
      <p style="color: #999; font-size: 12px; text-align: center;">
        © ${new Date().getFullYear()} Spark Dating App.
      </p>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `🔥 You matched with ${matchedName}!`,
    html,
    text: `Hi ${userName}, you and ${matchedName} liked each other! Open Spark to start chatting.`,
  });
}

// ── Verification email ──────────────────────────────────────────

export async function sendVerificationEmail(
  email: string,
  userName: string,
  status: 'approved' | 'rejected',
): Promise<boolean> {
  const safeName = escapeHtml(userName);
  const isApproved = status === 'approved';

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #00E676;">🔥 Spark</h1>
      </div>
      <h2 style="color: #333;">Verification ${isApproved ? 'Approved ✅' : 'Update'}</h2>
      <p>Hi ${safeName},</p>
      <p>${isApproved
        ? 'Your photo verification has been approved! Your profile now shows a verified badge, which increases your match rate.'
        : 'Your photo verification was not approved. Please try again with a clearer photo that matches your profile pictures.'
      }</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.APP_URL || 'http://localhost:3000'}"
           style="background-color: #00E676; color: #1a1a1a; padding: 14px 28px;
                  text-decoration: none; border-radius: 8px; font-weight: 600;
                  display: inline-block;">
          Open Spark
        </a>
      </div>
      <p style="color: #999; font-size: 12px; text-align: center;">
        © ${new Date().getFullYear()} Spark Dating App.
      </p>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: isApproved ? '✅ Verification Approved' : 'Verification Update',
    html,
    text: `Hi ${userName}, your photo verification has been ${status}.`,
  });
}

// ── Health check ────────────────────────────────────────────────

export async function verifyEmailConnection(): Promise<boolean> {
  if (transportMode === 'console') {
    console.log('ℹ️  Email service: console-only mode (no SMTP credentials)');
    return true;
  }

  try {
    await getTransporter().verify();
    console.log('✅ Email service connected to SMTP server');
    return true;
  } catch (error) {
    console.error('❌ Email service connection failed:', error);
    return false;
  }
}

// ── Queue status ────────────────────────────────────────────────

export function getEmailQueueStatus() {
  return {
    queueLength: emailQueue.length,
    mode: transportMode,
    oldestEmail: emailQueue[0]?.createdAt || null,
  };
}
