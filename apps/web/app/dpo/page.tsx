import React from 'react';

export default function DPOPage() {
  return (
    <main style={{ backgroundColor: '#0A0A0A', minHeight: '100vh', color: '#E0E0E0' }}>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '80px 24px 120px' }}>
        <div style={{ marginBottom: 48 }}>
          <a href="/" style={{ color: '#00E676', fontSize: 14, textDecoration: 'none', marginBottom: 24, display: 'inline-block' }}>
            ← Back to Spark
          </a>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 700, color: '#F0F0F0', marginBottom: 12 }}>
            Data Protection Officer
          </h1>
          <p style={{ fontSize: 14, color: '#5A5A5E' }}>GDPR Article 37–39 Compliance</p>
        </div>

        <div style={{ fontSize: 15, lineHeight: 1.8, color: '#A0A0A0' }}>
          <section style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#F0F0F0', marginBottom: 16 }}>Contact Our DPO</h2>
            <p style={{ marginBottom: 12 }}>
              Spark Dating App has appointed a Data Protection Officer (DPO) to oversee our data protection strategy and ensure compliance with GDPR and other applicable privacy laws.
            </p>
            <div style={{ background: '#141414', borderRadius: 12, padding: 24, border: '1px solid #1C1C1C', marginTop: 16 }}>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#555', textTransform: 'uppercase', marginBottom: 4 }}>Email</div>
                <a href="mailto:dpo@spark.dating" style={{ color: '#00E676', fontSize: 16 }}>dpo@spark.dating</a>
              </div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#555', textTransform: 'uppercase', marginBottom: 4 }}>Response Time</div>
                <div style={{ color: '#FFF', fontSize: 16 }}>Within 30 days of receipt</div>
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#555', textTransform: 'uppercase', marginBottom: 4 }}>Mail</div>
                <div style={{ color: '#FFF', fontSize: 16 }}>
                  Spark Dating Inc.<br />
                  Attn: Data Protection Officer<br />
                  123 Innovation Drive<br />
                  San Francisco, CA 94105
                </div>
              </div>
            </div>
          </section>

          <section style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#F0F0F0', marginBottom: 16 }}>When to Contact the DPO</h2>
            <ul style={{ paddingLeft: 24, marginBottom: 12 }}>
              <li style={{ marginBottom: 8 }}>To exercise your data subject rights (access, rectification, erasure, portability)</li>
              <li style={{ marginBottom: 8 }}>To ask about how your personal data is processed</li>
              <li style={{ marginBottom: 8 }}>To withdraw consent for data processing</li>
              <li style={{ marginBottom: 8 }}>To lodge a complaint about data handling</li>
              <li style={{ marginBottom: 8 }}>To request information about data breaches</li>
              <li style={{ marginBottom: 8 }}>To inquire about cross-border data transfers</li>
            </ul>
          </section>

          <section style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#F0F0F0', marginBottom: 16 }}>Supervisory Authority</h2>
            <p style={{ marginBottom: 12 }}>
              If you are not satisfied with our response, you have the right to lodge a complaint with your local data protection supervisory authority. For EU residents, a list of supervisory authorities is available at:
            </p>
            <a
              href="https://edpb.europa.eu/about-edpb/about-edpb/members_en"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#00E676' }}
            >
              https://edpb.europa.eu/about-edpb/about-edpb/members_en
            </a>
          </section>
        </div>
      </div>
    </main>
  );
}
