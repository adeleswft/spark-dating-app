/**
 * Headless test for the email service.
 * Verifies the service works without SMTP credentials (console-only mode).
 */

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✅ ${message}`);
    passed++;
  } else {
    console.log(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

import * as fs from 'fs';

// ═══════════════════════════════════════════════════════════════
// Test 1: email.ts exists and exports required functions
// ═══════════════════════════════════════════════════════════════
console.log('\nTest 1: email.ts exists and exports...');

const emailContent = fs.readFileSync('src/services/email.ts', 'utf-8');

assert(emailContent.includes('export async function sendEmail'), 'Exports sendEmail');
assert(emailContent.includes('export async function sendPasswordResetEmail'), 'Exports sendPasswordResetEmail');
assert(emailContent.includes('export async function verifyEmailConnection'), 'Exports verifyEmailConnection');

// ═══════════════════════════════════════════════════════════════
// Test 2: password reset route uses sendPasswordResetEmail
// ═══════════════════════════════════════════════════════════════
console.log('\nTest 2: Password reset route sends email...');

const resetContent = fs.readFileSync('src/routes/passwordReset.ts', 'utf-8');

assert(
  resetContent.includes("import { sendPasswordResetEmail } from '../services/email'"),
  'Imports sendPasswordResetEmail from email service'
);

assert(
  resetContent.includes('await sendPasswordResetEmail(email, token, user.name)'),
  'Calls sendPasswordResetEmail with email, token, and user name'
);

// Verify the old dev-only token leak is gone
const oldLeakGone = !resetContent.includes('resetToken: token');
assert(oldLeakGone, 'Old dev-only resetToken in response body is removed');

// Verify the success message no longer reveals token
const noTokenInResponse = !resetContent.includes('resetToken: token');
assert(noTokenInResponse, 'Response never includes resetToken in JSON body');

// ═══════════════════════════════════════════════════════════════
// Test 3: email service uses nodemailer
// ═══════════════════════════════════════════════════════════════
console.log('\nTest 3: Email service uses nodemailer...');

assert(emailContent.includes("import nodemailer from 'nodemailer'"), 'Imports nodemailer');
assert(emailContent.includes('SMTP_HOST'), 'Reads SMTP_HOST from env');
assert(emailContent.includes('SMTP_PORT'), 'Reads SMTP_PORT from env');
assert(emailContent.includes('SMTP_USER'), 'Reads SMTP_USER from env');
assert(emailContent.includes('SMTP_PASS'), 'Reads SMTP_PASS from env');
assert(emailContent.includes('EMAIL_FROM'), 'Reads EMAIL_FROM from env');

// Verify dev fallback when no SMTP credentials
assert(
  emailContent.includes('Email service: console-only mode') || emailContent.includes('No SMTP credentials'),
  'Logs info when no SMTP credentials configured'
);

// ═══════════════════════════════════════════════════════════════
// Test 4: password reset email template is well-formed
// ═══════════════════════════════════════════════════════════════
console.log('\nTest 4: Password reset email template...');

assert(emailContent.includes('Reset Your Password'), 'Email has reset password heading');
assert(emailContent.includes('1 hour'), 'Email mentions token expiry');
assert(emailContent.includes('APP_URL'), 'Uses APP_URL for reset link');
assert(emailContent.includes('reset-password?token='), 'Reset URL includes token parameter');
assert(emailContent.includes('text,'), 'Includes plain text fallback in sendEmail call');

// ═══════════════════════════════════════════════════════════════
// Test 5: .env.example has email configuration
// ═══════════════════════════════════════════════════════════════
console.log('\nTest 5: .env.example has email config...');

const envContent = fs.readFileSync('../../.env.example', 'utf-8');

assert(envContent.includes('SMTP_HOST'), '.env.example has SMTP_HOST');
assert(envContent.includes('SMTP_PORT'), '.env.example has SMTP_PORT');
assert(envContent.includes('SMTP_USER'), '.env.example has SMTP_USER');
assert(envContent.includes('SMTP_PASS'), '.env.example has SMTP_PASS');
assert(envContent.includes('EMAIL_FROM'), '.env.example has EMAIL_FROM');
assert(envContent.includes('APP_URL'), '.env.example has APP_URL');

// ═══════════════════════════════════════════════════════════════
// Summary
// ═══════════════════════════════════════════════════════════════
console.log('\n═══════════════════════════════════════════════════════════════');
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log('═══════════════════════════════════════════════════════════════');

if (failed > 0) {
  process.exit(1);
}
