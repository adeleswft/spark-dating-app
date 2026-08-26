import React from 'react';

export default function CommunityGuidelinesPage() {
  return (
    <main style={{ backgroundColor: '#0A0A0A', minHeight: '100vh', color: '#E0E0E0' }}>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '80px 24px 120px' }}>
        <div style={{ marginBottom: 48 }}>
          <a href="/" style={{ color: '#00E676', fontSize: 14, textDecoration: 'none', marginBottom: 24, display: 'inline-block' }}>
            ← Back to Spark
          </a>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 700, color: '#F0F0F0', marginBottom: 12 }}>
            Community Guidelines
          </h1>
          <p style={{ fontSize: 14, color: '#5A5A5E' }}>Last updated: August 25, 2026</p>
        </div>

        <div style={{ fontSize: 15, lineHeight: 1.8, color: '#A0A0A0' }}>
          <p style={{ marginBottom: 24, fontSize: 16, color: '#E0E0E0' }}>
            Spark is built for genuine connections. These guidelines help keep our community safe, respectful, and fun for everyone.
          </p>

          <section style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#F0F0F0', marginBottom: 16 }}>📸 Be Authentic</h2>
            <ul style={{ paddingLeft: 24, marginBottom: 12 }}>
              <li style={{ marginBottom: 8 }}>Use recent photos that actually look like you.</li>
              <li style={{ marginBottom: 8 }}>Don&apos;t use photos of other people, celebrities, or stock images.</li>
              <li style={{ marginBottom: 8 }}>Keep your profile truthful — honesty builds real connections.</li>
              <li style={{ marginBottom: 8 }}>Complete verification to earn a verified badge and build trust.</li>
            </ul>
          </section>

          <section style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#F0F0F0', marginBottom: 16 }}>💛 Be Respectful</h2>
            <ul style={{ paddingLeft: 24, marginBottom: 12 }}>
              <li style={{ marginBottom: 8 }}>Treat others the way you want to be treated.</li>
              <li style={{ marginBottom: 8 }}>No harassment, hate speech, bullying, or threats.</li>
              <li style={{ marginBottom: 8 }}>Respect boundaries — if someone isn&apos;t interested, move on gracefully.</li>
              <li style={{ marginBottom: 8 }}>No unsolicited explicit content.</li>
            </ul>
          </section>

          <section style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#F0F0F0', marginBottom: 16 }}>🔒 Stay Safe</h2>
            <ul style={{ paddingLeft: 24, marginBottom: 12 }}>
              <li style={{ marginBottom: 8 }}>Never send money to someone you haven&apos;t met in person.</li>
              <li style={{ marginBottom: 8 }}>Don&apos;t share personal financial information (bank details, SSN).</li>
              <li style={{ marginBottom: 8 }}>Meet in public places for first dates.</li>
              <li style={{ marginBottom: 8 }}>Tell a friend where you&apos;re going and who you&apos;re meeting.</li>
              <li style={{ marginBottom: 8 }}>Trust your instincts — if something feels off, it probably is.</li>
            </ul>
          </section>

          <section style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#F0F0F0', marginBottom: 16 }}>🚫 Zero Tolerance</h2>
            <p style={{ marginBottom: 12 }}>The following will result in immediate account suspension or ban:</p>
            <ul style={{ paddingLeft: 24, marginBottom: 12 }}>
              <li style={{ marginBottom: 8 }}>Scamming or attempting to defraud other users.</li>
              <li style={{ marginBottom: 8 }}>Threats of violence or harm.</li>
              <li style={{ marginBottom: 8 }}>Sharing intimate content of others without consent.</li>
              <li style={{ marginBottom: 8 }}>Any sexual activity involving minors.</li>
              <li style={{ marginBottom: 8 }}>Impersonating others or creating fake accounts.</li>
              <li style={{ marginBottom: 8 }}>Automated bots or spam accounts.</li>
            </ul>
          </section>

          <section style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#F0F0F0', marginBottom: 16 }}>📢 Report & Block</h2>
            <p style={{ marginBottom: 12 }}>
              If someone violates these guidelines, please report them through the app. Reports are reviewed by our AI moderation system and human team. You can also block any user at any time — they won&apos;t be notified.
            </p>
          </section>

          <section style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#F0F0F0', marginBottom: 16 }}>⚖️ Enforcement</h2>
            <p style={{ marginBottom: 12 }}>Violations may result in:</p>
            <ul style={{ paddingLeft: 24, marginBottom: 12 }}>
              <li style={{ marginBottom: 8 }}><strong style={{ color: '#FFD600' }}>Warning</strong> — for minor first-time violations.</li>
              <li style={{ marginBottom: 8 }}><strong style={{ color: '#FF9800' }}>Restriction</strong> — temporary feature limitations.</li>
              <li style={{ marginBottom: 8 }}><strong style={{ color: '#FF5252' }}>Suspension</strong> — temporary account lock.</li>
              <li style={{ marginBottom: 8 }}><strong style={{ color: '#FF1744' }}>Ban</strong> — permanent account removal.</li>
            </ul>
          </section>

          <div style={{ marginTop: 48, padding: 24, background: '#141414', borderRadius: 16, border: '1px solid #1E1E22', textAlign: 'center' }}>
            <p style={{ fontSize: 14, color: '#A0A0A0', marginBottom: 12 }}>
              These guidelines are a living document. We&apos;ll update them as our community grows.
            </p>
            <p style={{ fontSize: 14, color: '#A0A0A0' }}>
              Questions? Contact us at{' '}
              <a href="mailto:support@spark.dating" style={{ color: '#00E676' }}>support@spark.dating</a>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
