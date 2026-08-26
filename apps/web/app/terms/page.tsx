import React from 'react';

export default function TermsOfServicePage() {
  return (
    <main style={{ backgroundColor: '#0A0A0A', minHeight: '100vh', color: '#E0E0E0' }}>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '80px 24px 120px' }}>
        <div style={{ marginBottom: 48 }}>
          <a href="/" style={{ color: '#00E676', fontSize: 14, textDecoration: 'none', marginBottom: 24, display: 'inline-block' }}>
            ← Back to Spark
          </a>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 700, color: '#F0F0F0', marginBottom: 12 }}>
            Terms of Service
          </h1>
          <p style={{ fontSize: 14, color: '#5A5A5E' }}>Last updated: August 25, 2026</p>
        </div>

        <div style={{ fontSize: 15, lineHeight: 1.8, color: '#A0A0A0' }}>
          <section style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#F0F0F0', marginBottom: 16 }}>1. Acceptance of Terms</h2>
            <p>By accessing or using Spark (&quot;the App&quot;), you agree to be bound by these Terms of Service. If you do not agree, do not use the App.</p>
          </section>

          <section style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#F0F0F0', marginBottom: 16 }}>2. Eligibility</h2>
            <p>You must be at least 18 years old to use Spark. By creating an account, you represent and warrant that you are at least 18 and have the legal capacity to enter into these terms.</p>
          </section>

          <section style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#F0F0F0', marginBottom: 16 }}>3. Account</h2>
            <p style={{ marginBottom: 12 }}>You are responsible for maintaining the confidentiality of your account credentials. You agree to:</p>
            <ul style={{ paddingLeft: 24, marginBottom: 12 }}>
              <li style={{ marginBottom: 8 }}>Provide accurate and complete registration information.</li>
              <li style={{ marginBottom: 8 }}>Keep your password secure and not share it with others.</li>
              <li style={{ marginBottom: 8 }}>Notify us immediately of any unauthorized access to your account.</li>
              <li style={{ marginBottom: 8 }}>Not create multiple accounts or use false identities.</li>
            </ul>
          </section>

          <section style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#F0F0F0', marginBottom: 16 }}>4. User Conduct</h2>
            <p style={{ marginBottom: 12 }}>You agree not to:</p>
            <ul style={{ paddingLeft: 24, marginBottom: 12 }}>
              <li style={{ marginBottom: 8 }}>Use the App for any illegal or unauthorized purpose.</li>
              <li style={{ marginBottom: 8 }}>Harass, threaten, or intimidate other users.</li>
              <li style={{ marginBottom: 8 }}>Post false, misleading, or fraudulent content.</li>
              <li style={{ marginBottom: 8 }}>Impersonate another person or entity.</li>
              <li style={{ marginBottom: 8 }}>Use automated systems (bots, scrapers) to access the App.</li>
              <li style={{ marginBottom: 8 }}>Share other users&apos; personal information without consent.</li>
              <li style={{ marginBottom: 8 }}>Send spam, phishing messages, or unsolicited commercial content.</li>
              <li style={{ marginBottom: 8 }}>Attempt to circumvent safety features or content moderation.</li>
            </ul>
          </section>

          <section style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#F0F0F0', marginBottom: 16 }}>5. AI-Powered Features</h2>
            <p style={{ marginBottom: 12 }}>Spark uses artificial intelligence for matching, content moderation, and safety. You acknowledge that:</p>
            <ul style={{ paddingLeft: 24, marginBottom: 12 }}>
              <li style={{ marginBottom: 8 }}>AI-generated match suggestions are recommendations, not guarantees.</li>
              <li style={{ marginBottom: 8 }}>Messages may be automatically analyzed for safety and scam detection.</li>
              <li style={{ marginBottom: 8 }}>Profile content may be analyzed by AI to detect fraudulent accounts.</li>
              <li style={{ marginBottom: 8 }}>We may use AI-generated conversation starters based on your profile data.</li>
            </ul>
          </section>

          <section style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#F0F0F0', marginBottom: 16 }}>6. Subscriptions and Payments</h2>
            <p style={{ marginBottom: 12 }}>Spark offers optional subscription plans (Spark+ and Spark Elite). By subscribing:</p>
            <ul style={{ paddingLeft: 24, marginBottom: 12 }}>
              <li style={{ marginBottom: 8 }}>Payments are processed through the App Store or Google Play.</li>
              <li style={{ marginBottom: 8 }}>Subscriptions auto-renew unless cancelled at least 24 hours before renewal.</li>
              <li style={{ marginBottom: 8 }}>All purchases are final — no refunds will be issued.</li>
              <li style={{ marginBottom: 8 }}>We reserve the right to modify pricing with 30 days&apos; notice.</li>
            </ul>
          </section>

          <section style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#F0F0F0', marginBottom: 16 }}>7. Safety</h2>
            <p style={{ marginBottom: 12 }}>While we implement verification and moderation features, we cannot guarantee your safety. You are responsible for:</p>
            <ul style={{ paddingLeft: 24, marginBottom: 12 }}>
              <li style={{ marginBottom: 8 }}>Exercising caution when meeting people in person.</li>
              <li style={{ marginBottom: 8 }}>Not sharing personal financial or sensitive information.</li>
              <li style={{ marginBottom: 8 }}>Reporting suspicious or harmful behavior.</li>
              <li style={{ marginBottom: 8 }}>Meeting in public places for first dates.</li>
            </ul>
          </section>

          <section style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#F0F0F0', marginBottom: 16 }}>8. Intellectual Property</h2>
            <p>All content, features, and functionality of Spark are owned by us and protected by copyright, trademark, and other intellectual property laws. You may not reproduce, distribute, or create derivative works without our written permission.</p>
          </section>

          <section style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#F0F0F0', marginBottom: 16 }}>9. Limitation of Liability</h2>
            <p>To the maximum extent permitted by law, Spark shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the App. Our total liability shall not exceed the amount you paid us in the 12 months preceding the claim.</p>
          </section>

          <section style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#F0F0F0', marginBottom: 16 }}>10. Termination</h2>
            <p>We may suspend or terminate your account at any time for violation of these Terms. You may also delete your account at any time from the app settings. Upon termination, your right to use the App ceases immediately.</p>
          </section>

          <section style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#F0F0F0', marginBottom: 16 }}>11. Changes to Terms</h2>
            <p>We may update these Terms from time to time. Continued use of the App after changes constitutes acceptance of the new Terms. We will notify you of material changes through the App or by email.</p>
          </section>

          <section style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#F0F0F0', marginBottom: 16 }}>12. Contact</h2>
            <p>Questions about these Terms? Contact us at <a href="mailto:legal@spark.dating" style={{ color: '#00E676' }}>legal@spark.dating</a>.</p>
          </section>
        </div>
      </div>
    </main>
  );
}
