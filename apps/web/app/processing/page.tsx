import React from 'react';

export default function DataProcessingPage() {
  return (
    <main style={{ backgroundColor: '#0A0A0A', minHeight: '100vh', color: '#E0E0E0' }}>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '80px 24px 120px' }}>
        <div style={{ marginBottom: 48 }}>
          <a href="/" style={{ color: '#00E676', fontSize: 14, textDecoration: 'none', marginBottom: 24, display: 'inline-block' }}>
            ← Back to Spark
          </a>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 700, color: '#F0F0F0', marginBottom: 12 }}>
            Data Processing Activities
          </h1>
          <p style={{ fontSize: 14, color: '#5A5A5E' }}>GDPR Article 30 — Records of Processing Activities</p>
        </div>

        <div style={{ fontSize: 15, lineHeight: 1.8, color: '#A0A0A0' }}>
          <section style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#F0F0F0', marginBottom: 16 }}>1. Controller Information</h2>
            <div style={{ background: '#141414', borderRadius: 12, padding: 20, border: '1px solid #1C1C1C' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '8px 16px' }}>
                <div style={{ color: '#555', fontWeight: 600 }}>Controller</div>
                <div style={{ color: '#FFF' }}>Spark Dating Inc.</div>
                <div style={{ color: '#555', fontWeight: 600 }}>DPO</div>
                <div><a href="mailto:dpo@spark.dating" style={{ color: '#00E676' }}>dpo@spark.dating</a></div>
                <div style={{ color: '#555', fontWeight: 600 }}>Purpose</div>
                <div style={{ color: '#FFF' }}>Operating a dating platform and matching users</div>
              </div>
            </div>
          </section>

          <section style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#F0F0F0', marginBottom: 16 }}>2. Categories of Data Subjects</h2>
            <ul style={{ paddingLeft: 24 }}>
              <li style={{ marginBottom: 8 }}>App users (registered accounts)</li>
              <li style={{ marginBottom: 8 }}>Website visitors (analytics)</li>
              <li style={{ marginBottom: 8 }}>Admin team members</li>
            </ul>
          </section>

          <section style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#F0F0F0', marginBottom: 16 }}>3. Categories of Personal Data</h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #2A2A2A' }}>
                    <th style={{ textAlign: 'left', padding: '12px 8px', color: '#FFF', fontWeight: 600 }}>Category</th>
                    <th style={{ textAlign: 'left', padding: '12px 8px', color: '#FFF', fontWeight: 600 }}>Data Elements</th>
                    <th style={{ textAlign: 'left', padding: '12px 8px', color: '#FFF', fontWeight: 600 }}>Legal Basis</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Identity', 'Name, email, DOB, gender', 'Contract (Art. 6(1)(b))'],
                    ['Profile', 'Photos, bio, interests, preferences', 'Contract (Art. 6(1)(b))'],
                    ['Location', 'GPS coordinates, IP-based location', 'Consent (Art. 6(1)(a))'],
                    ['Communication', 'Messages between matched users', 'Contract (Art. 6(1)(b))'],
                    ['Behavioral', 'Swipe history, feature usage', 'Legitimate interest (Art. 6(1)(f))'],
                    ['Verification', 'Selfie photos, ID documents', 'Consent (Art. 6(1)(a))'],
                    ['Financial', 'Subscription receipts, transaction IDs', 'Contract (Art. 6(1)(b))'],
                    ['Device', 'Device ID, IP, platform, VPN status', 'Legitimate interest (Art. 6(1)(f))'],
                    ['AI', 'Compatibility embeddings, scores', 'Legitimate interest (Art. 6(1)(f))'],
                    ['Safety', 'Reports, moderation actions', 'Legal obligation (Art. 6(1)(c))'],
                  ].map(([cat, data, basis], i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #1C1C1C' }}>
                      <td style={{ padding: '10px 8px', color: '#FFF', fontWeight: 500 }}>{cat}</td>
                      <td style={{ padding: '10px 8px' }}>{data}</td>
                      <td style={{ padding: '10px 8px', color: '#00E676', fontSize: 13 }}>{basis}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#F0F0F0', marginBottom: 16 }}>4. Processing Purposes</h2>
            <ul style={{ paddingLeft: 24 }}>
              <li style={{ marginBottom: 8 }}><strong style={{ color: '#F0F0F0' }}>Account management:</strong> Registration, authentication, profile management</li>
              <li style={{ marginBottom: 8 }}><strong style={{ color: '#F0F0F0' }}>Matching:</strong> AI-powered compatibility scoring and profile recommendations</li>
              <li style={{ marginBottom: 8 }}><strong style={{ color: '#F0F0F0' }}>Communication:</strong> Messaging between matched users, push notifications</li>
              <li style={{ marginBottom: 8 }}><strong style={{ color: '#F0F0F0' }}>Safety:</strong> Content moderation, scam detection, harassment prevention</li>
              <li style={{ marginBottom: 8 }}><strong style={{ color: '#F0F0F0' }}>Verification:</strong> Identity verification to prevent catfishing</li>
              <li style={{ marginBottom: 8 }}><strong style={{ color: '#F0F0F0' }}>Payments:</strong> Subscription management and receipt validation</li>
              <li><strong style={{ color: '#F0F0F0' }}>Analytics:</strong> Product improvement and user experience optimization</li>
            </ul>
          </section>

          <section style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#F0F0F0', marginBottom: 16 }}>5. Data Recipients</h2>
            <ul style={{ paddingLeft: 24 }}>
              <li style={{ marginBottom: 8 }}><strong style={{ color: '#F0F0F0' }}>Expo (push notifications):</strong> Push token delivery — Data Processing Agreement in place</li>
              <li style={{ marginBottom: 8 }}><strong style={{ color: '#F0F0F0' }}>Apple / Google (IAP):</strong> Receipt validation — Data Processing Agreement in place</li>
              <li style={{ marginBottom: 8 }}><strong style={{ color: '#F0F0F0' }}>OpenAI (optional):</strong> Content moderation and explanations — only when API key configured</li>
              <li><strong style={{ color: '#F0F0F0' }}>Hosting provider:</strong> Database and file storage — Data Processing Agreement in place</li>
            </ul>
          </section>

          <section style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#F0F0F0', marginBottom: 16 }}>6. Data Retention</h2>
            <ul style={{ paddingLeft: 24 }}>
              <li style={{ marginBottom: 8 }}>Active accounts: data retained while account is active</li>
              <li style={{ marginBottom: 8 }}>Deleted accounts: personal data removed within 30 days</li>
              <li style={{ marginBottom: 8 }}>Safety records (reports, moderation): retained for 3 years for legal compliance</li>
              <li style={{ marginBottom: 8 }}>Financial records: retained for 7 years (tax/legal requirements)</li>
              <li>Push tokens: removed on logout or password change</li>
            </ul>
          </section>

          <section style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#F0F0F0', marginBottom: 16 }}>7. International Transfers</h2>
            <p>
              User data may be processed in the United States where our hosting infrastructure is located. We ensure appropriate safeguards through Standard Contractual Clauses (SCCs) with our hosting provider, as required by GDPR Chapter V.
            </p>
          </section>

          <section style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#F0F0F0', marginBottom: 16 }}>8. Security Measures</h2>
            <ul style={{ paddingLeft: 24 }}>
              <li style={{ marginBottom: 8 }}>Encryption in transit (TLS 1.3)</li>
              <li style={{ marginBottom: 8 }}>Password hashing (bcrypt, salt rounds = 10)</li>
              <li style={{ marginBottom: 8 }}>JWT-based authentication with expiry</li>
              <li style={{ marginBottom: 8 }}>Rate limiting on authentication endpoints</li>
              <li style={{ marginBottom: 8 }}>CORS restrictions</li>
              <li style={{ marginBottom: 8 }}>Content moderation (AI + pattern matching)</li>
              <li>Role-based access control for admin functions</li>
            </ul>
          </section>
        </div>
      </div>
    </main>
  );
}
