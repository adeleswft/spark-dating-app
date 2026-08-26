import React from 'react';

export default function PrivacyPolicyPage() {
  return (
    <main style={{ backgroundColor: '#0A0A0A', minHeight: '100vh', color: '#E0E0E0' }}>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '80px 24px 120px' }}>
        {/* Header */}
        <div style={{ marginBottom: 48 }}>
          <a href="/" style={{ color: '#00E676', fontSize: 14, textDecoration: 'none', marginBottom: 24, display: 'inline-block' }}>
            ← Back to Spark
          </a>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 700, color: '#F0F0F0', marginBottom: 12 }}>
            Privacy Policy
          </h1>
          <p style={{ fontSize: 14, color: '#5A5A5E' }}>Last updated: August 25, 2026</p>
        </div>

        {/* Content */}
        <div style={{ fontSize: 15, lineHeight: 1.8, color: '#A0A0A0' }}>
          <section style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#F0F0F0', marginBottom: 16 }}>1. Information We Collect</h2>
            <p style={{ marginBottom: 12 }}>
              When you use Spark, we collect information you provide directly and information generated through your use of the service:
            </p>
            <ul style={{ paddingLeft: 24, marginBottom: 12 }}>
              <li style={{ marginBottom: 8 }}><strong style={{ color: '#F0F0F0' }}>Profile Information:</strong> Name, date of birth, gender, photos, bio, interests, and preferences.</li>
              <li style={{ marginBottom: 8 }}><strong style={{ color: '#F0F0F0' }}>Communication Data:</strong> Messages you send through the app, which may be analyzed by AI for safety purposes.</li>
              <li style={{ marginBottom: 8 }}><strong style={{ color: '#F0F0F0' }}>Verification Data:</strong> Photos submitted for verification, ID documents (processed and deleted after verification).</li>
              <li style={{ marginBottom: 8 }}><strong style={{ color: '#F0F0F0' }}>Device Information:</strong> Device type, operating system, unique device identifiers, and IP address.</li>
              <li style={{ marginBottom: 8 }}><strong style={{ color: '#F0F0F0' }}>Location Data:</strong> Approximate location based on IP address or, with your permission, precise GPS location.</li>
              <li style={{ marginBottom: 8 }}><strong style={{ color: '#F0F0F0' }}>Usage Data:</strong> Swipe history, matches, messages, feature usage, and session duration.</li>
            </ul>
          </section>

          <section style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#F0F0F0', marginBottom: 16 }}>2. How We Use Your Information</h2>
            <ul style={{ paddingLeft: 24, marginBottom: 12 }}>
              <li style={{ marginBottom: 8 }}>To provide and improve the Spark dating service.</li>
              <li style={{ marginBottom: 8 }}>To power our AI matching algorithm and generate compatibility scores.</li>
              <li style={{ marginBottom: 8 }}>To analyze messages for safety, scam detection, and harassment prevention.</li>
              <li style={{ marginBottom: 8 }}>To verify your identity and prevent catfishing.</li>
              <li style={{ marginBottom: 8 }}>To send you notifications about matches, messages, and service updates.</li>
              <li style={{ marginBottom: 8 }}>To process subscriptions and payments.</li>
              <li style={{ marginBottom: 8 }}>To enforce our Terms of Service and maintain platform safety.</li>
            </ul>
          </section>

          <section style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#F0F0F0', marginBottom: 16 }}>3. AI and Automated Processing</h2>
            <p style={{ marginBottom: 12 }}>
              Spark uses artificial intelligence to enhance your experience. This includes:
            </p>
            <ul style={{ paddingLeft: 24, marginBottom: 12 }}>
              <li style={{ marginBottom: 8 }}><strong style={{ color: '#F0F0F0' }}>Compatibility Matching:</strong> Your profile data and behavior patterns are processed by our AI to suggest compatible matches.</li>
              <li style={{ marginBottom: 8 }}><strong style={{ color: '#F0F0F0' }}>Content Moderation:</strong> Messages are automatically analyzed for scam patterns, harassment, and inappropriate content.</li>
              <li style={{ marginBottom: 8 }}><strong style={{ color: '#F0F0F0' }}>Profile Review:</strong> AI analyzes photos and profiles to detect fake accounts and ensure authenticity.</li>
              <li style={{ marginBottom: 8 }}><strong style={{ color: '#F0F0F0' }}>Conversation Starters:</strong> AI generates personalized ice-breaker suggestions based on shared interests.</li>
            </ul>
          </section>

          <section style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#F0F0F0', marginBottom: 16 }}>4. Data Sharing</h2>
            <p style={{ marginBottom: 12 }}>
              We do not sell your personal information. We may share data with:
            </p>
            <ul style={{ paddingLeft: 24, marginBottom: 12 }}>
              <li style={{ marginBottom: 8 }}><strong style={{ color: '#F0F0F0' }}>Other Users:</strong> Your profile information (name, photos, bio, interests) is visible to users you&apos;re matched with.</li>
              <li style={{ marginBottom: 8 }}><strong style={{ color: '#F0F0F0' }}>Service Providers:</strong> Trusted third parties that help us operate the service (hosting, analytics, payment processing).</li>
              <li style={{ marginBottom: 8 }}><strong style={{ color: '#F0F0F0' }}>Legal Requirements:</strong> When required by law, court order, or to protect the safety of our users.</li>
            </ul>
          </section>

          <section style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#F0F0F0', marginBottom: 16 }}>5. Data Security</h2>
            <p style={{ marginBottom: 12 }}>
              We implement industry-standard security measures to protect your data, including encryption in transit (TLS) and at rest, secure authentication with JWT tokens, and regular security audits. However, no method of transmission or storage is 100% secure.
            </p>
          </section>

          <section style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#F0F0F0', marginBottom: 16 }}>6. Data Retention</h2>
            <p style={{ marginBottom: 12 }}>
              We retain your data for as long as your account is active. If you delete your account, we remove your personal information within 30 days, except where we need to retain certain data for legal or legitimate business purposes (e.g., fraud prevention records).
            </p>
          </section>

          <section style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#F0F0F0', marginBottom: 16 }}>7. Your Rights</h2>
            <p style={{ marginBottom: 12 }}>You have the right to:</p>
            <ul style={{ paddingLeft: 24, marginBottom: 12 }}>
              <li style={{ marginBottom: 8 }}>Access, correct, or delete your personal information.</li>
              <li style={{ marginBottom: 8 }}>Export your data in a portable format.</li>
              <li style={{ marginBottom: 8 }}>Opt out of AI-based processing (contact support).</li>
              <li style={{ marginBottom: 8 }}>Withdraw consent for location tracking at any time.</li>
              <li style={{ marginBottom: 8 }}>Delete your account from the app settings.</li>
            </ul>
          </section>

          <section style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#F0F0F0', marginBottom: 16 }}>8. Children&apos;s Privacy</h2>
            <p style={{ marginBottom: 12 }}>
              Spark is not intended for users under 18. We do not knowingly collect information from children. If we discover that a user is under 18, we will immediately terminate their account.
            </p>
          </section>

          <section style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#F0F0F0', marginBottom: 16 }}>9. Changes to This Policy</h2>
            <p style={{ marginBottom: 12 }}>
              We may update this Privacy Policy from time to time. We will notify you of significant changes through the app or by email.
            </p>
          </section>

          <section style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#F0F0F0', marginBottom: 16 }}>10. Contact Us</h2>
            <p style={{ marginBottom: 12 }}>
              If you have questions about this Privacy Policy, please contact us at{' '}
              <a href="mailto:privacy@spark.dating" style={{ color: '#00E676' }}>privacy@spark.dating</a>.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
