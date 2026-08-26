import React from 'react'

/* ── Icon components (CSS shapes instead of emoji) ─────────────── */
function IconAI() {
  return (
    <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, #00E676 0%, #00C853 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
      </svg>
    </div>
  )
}

function IconShield() {
  return (
    <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, #7C4DFF 0%, #651FFF 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M9 12l2 2 4-4" />
      </svg>
    </div>
  )
}

function IconChat() {
  return (
    <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, #FFD600 0%, #FFC107 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      </svg>
    </div>
  )
}

function IconHeart() {
  return (
    <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, #FF5252 0%, #D32F2F 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
      </svg>
    </div>
  )
}

function IconCalendar() {
  return (
    <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, #00BFA5 0%, #00897B 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    </div>
  )
}

function IconSpark() {
  return (
    <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, #00E676 0%, #00C853 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    </div>
  )
}

/* ── Compatibility Demo (hero signature element) ───────────────── */
function CompatibilityDemo() {
  return (
    <div style={{ position: 'relative', width: 320, height: 400, flexShrink: 0 }}>
      {/* Connection arc */}
      <svg width="320" height="400" viewBox="0 0 320 400" style={{ position: 'absolute', top: 0, left: 0 }}>
        <defs>
          <linearGradient id="arcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00E676" stopOpacity="0.6" />
            <stop offset="50%" stopColor="#00E676" stopOpacity="1" />
            <stop offset="100%" stopColor="#00E676" stopOpacity="0.6" />
          </linearGradient>
        </defs>
        <path d="M 80 120 Q 160 40 240 120" fill="none" stroke="url(#arcGrad)" strokeWidth="2" strokeDasharray="6 4" />
      </svg>

      {/* Score badge in the arc */}
      <div style={{ position: 'absolute', top: 48, left: '50%', transform: 'translateX(-50%)', background: '#00E676', color: '#000', fontWeight: 800, fontSize: 18, padding: '6px 16px', borderRadius: 20, letterSpacing: '-0.5px' }}>
        94% match
      </div>

      {/* Profile A */}
      <div style={{ position: 'absolute', top: 100, left: 0, width: 120, background: '#161618', borderRadius: 16, border: '1px solid #1E1E22', overflow: 'hidden' }}>
        <div style={{ height: 140, background: 'linear-gradient(135deg, #1B3A2A, #0D2818)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 48 }}>👤</span>
        </div>
        <div style={{ padding: '10px 12px' }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#F0F0F0' }}>Sarah, 26</div>
          <div style={{ fontSize: 11, color: '#8A8A8E', marginTop: 2 }}>2 miles away</div>
        </div>
      </div>

      {/* Profile B */}
      <div style={{ position: 'absolute', top: 100, right: 0, width: 120, background: '#161618', borderRadius: 16, border: '1px solid #1E1E22', overflow: 'hidden' }}>
        <div style={{ height: 140, background: 'linear-gradient(135deg, #2A1B3A, #180D28)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 48 }}>👤</span>
        </div>
        <div style={{ padding: '10px 12px' }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#F0F0F0' }}>You</div>
          <div style={{ fontSize: 11, color: '#8A8A8E', marginTop: 2 }}>Active now</div>
        </div>
      </div>

      {/* Shared interests below */}
      <div style={{ position: 'absolute', bottom: 60, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, width: '100%' }}>
        <div style={{ fontSize: 11, color: '#5A5A5E', textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 600 }}>Shared interests</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
          {['Hiking', 'Coffee', 'Dogs', 'Photography'].map(t => (
            <span key={t} style={{ fontSize: 12, color: '#00E676', background: 'rgba(0,230,118,0.1)', padding: '4px 10px', borderRadius: 12, border: '1px solid rgba(0,230,118,0.2)' }}>{t}</span>
          ))}
        </div>
      </div>

      {/* Floating compatibility bars */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {[
          { label: 'Interests', score: 92, color: '#00E676' },
          { label: 'Lifestyle', score: 88, color: '#7C4DFF' },
          { label: 'Values', score: 95, color: '#FFD600' },
        ].map(bar => (
          <div key={bar.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 10, color: '#5A5A5E', width: 55, textAlign: 'right' }}>{bar.label}</span>
            <div style={{ flex: 1, height: 4, background: '#1E1E22', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ width: `${bar.score}%`, height: '100%', background: bar.color, borderRadius: 2 }} />
            </div>
            <span style={{ fontSize: 10, color: '#8A8A8E', width: 28 }}>{bar.score}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Main Page ─────────────────────────────────────────────────── */
export default function Home() {
  const features = [
    { icon: <IconAI />, title: 'AI Compatibility Scoring', desc: 'Every match comes with a breakdown of why you click. Vector embeddings, collaborative filtering, and preference matching — all working together behind the scenes.' },
    { icon: <IconShield />, title: 'Multi-Layer Verification', desc: 'Phone, photo with liveness detection, and ID verification keep catfish out. Verified users get priority in discovery.' },
    { icon: <IconChat />, title: 'AI Conversation Starters', desc: 'Never stare at a blank chat again. Spark generates ice-breakers based on your shared interests and profile details.' },
    { icon: <IconHeart />, title: 'Curated Daily Matches', desc: 'Quality over quantity. Get 10–20 highly compatible matches per day instead of endless swiping. Every match is intentional.' },
    { icon: <IconCalendar />, title: 'AI Date Planner', desc: 'Spark suggests date ideas based on your mutual interests, location, and budget. Premium feature for Elite users.' },
    { icon: <IconSpark />, title: 'AI-Powered Safety', desc: 'Real-time message scanning detects scam patterns and harassment before they reach you. AI triage with human review for flagged content.' },
  ]

  return (
    <main>
      {/* ── Hero ───────────────────────────────────────────────── */}
      <section style={{
        background: 'linear-gradient(160deg, #0A0A0A 0%, #0D1F15 40%, #0A0A0A 100%)',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '80px 48px',
        borderBottom: '1px solid #1E1E22',
      }}>
        <div style={{ maxWidth: 1200, width: '100%', display: 'flex', alignItems: 'center', gap: 80, flexWrap: 'wrap', justifyContent: 'center' }}>
          {/* Left: Copy */}
          <div style={{ flex: '1 1 400px', maxWidth: 520 }}>
            <div style={{ fontSize: 12, color: '#00E676', fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 24, fontFamily: 'var(--font-display)' }}>
              AI-Powered Dating
            </div>
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(40px, 5vw, 64px)',
              fontWeight: 700,
              lineHeight: 1.05,
              marginBottom: 20,
              color: '#F0F0F0',
            }}>
              Stop swiping.<br />
              Start <span style={{ color: '#00E676' }}>connecting</span>.
            </h1>
            <p style={{ fontSize: 18, color: '#8A8A8E', lineHeight: 1.7, marginBottom: 40, maxWidth: 440 }}>
              Spark uses AI to find your perfect match based on deep compatibility — not just photos. Real connections, powered by real intelligence.
            </p>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <a href="https://play.google.com/store/apps/details?id=com.spark.dating" target="_blank" rel="noopener noreferrer" style={{
                backgroundColor: '#00E676',
                color: '#000',
                padding: '15px 32px',
                borderRadius: 12,
                fontSize: 15,
                fontWeight: 700,
                fontFamily: 'var(--font-display)',
                transition: 'transform 0.2s, box-shadow 0.2s',
                display: 'inline-block',
              }}>
                Download Free
              </a>
              <a href="#pricing" style={{
                backgroundColor: 'transparent',
                color: '#F0F0F0',
                padding: '15px 32px',
                borderRadius: 12,
                fontSize: 15,
                fontWeight: 600,
                border: '1px solid #2A2A2A',
                transition: 'border-color 0.2s',
                display: 'inline-block',
              }}>
                See Plans
              </a>
            </div>
          </div>

          {/* Right: Compatibility Demo */}
          <div style={{ flex: '1 1 320px', maxWidth: 400, display: 'flex', justifyContent: 'center' }}>
            <CompatibilityDemo />
          </div>
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────── */}
      <section style={{ padding: '100px 48px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <div style={{ fontSize: 12, color: '#5A5A5E', fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>Process</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 3.5vw, 40px)', fontWeight: 700, color: '#F0F0F0' }}>
            How <span style={{ color: '#00E676' }}>Spark</span> works
          </h2>
        </div>

        {/* Horizontal flow */}
        <div style={{ display: 'flex', gap: 0, position: 'relative', justifyContent: 'center', flexWrap: 'wrap' }}>
          {[
            { step: '01', title: 'Create your profile', desc: 'Add photos, write your bio, pick your interests. AI optimizes your profile for better matches.' },
            { step: '02', title: 'AI finds your matches', desc: 'Our algorithm analyzes compatibility across 5 dimensions using embeddings and collaborative filtering.' },
            { step: '03', title: 'Start a conversation', desc: 'Get AI-generated ice-breakers tailored to each match. No more "hey" openers.' },
            { step: '04', title: 'Meet your match', desc: 'Plan the perfect date with our AI Date Planner that suggests activities you\'ll both love.' },
          ].map((item, i) => (
            <div key={item.step} style={{ flex: '1 1 200px', maxWidth: 260, padding: '0 20px', position: 'relative' }}>
              {/* Connector line */}
              {i < 3 && (
                <div style={{ position: 'absolute', top: 24, right: -8, width: 16, height: 1, background: '#1E1E22' }} />
              )}
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: 11,
                color: '#00E676',
                fontWeight: 700,
                letterSpacing: 1,
                marginBottom: 12,
              }}>
                {item.step}
              </div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: '#F0F0F0', marginBottom: 8 }}>
                {item.title}
              </h3>
              <p style={{ fontSize: 14, color: '#8A8A8E', lineHeight: 1.6 }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────── */}
      <section id="features" style={{ padding: '100px 48px', backgroundColor: '#111113', borderTop: '1px solid #1E1E22', borderBottom: '1px solid #1E1E22' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <div style={{ fontSize: 12, color: '#5A5A5E', fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>Why Spark</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 3.5vw, 40px)', fontWeight: 700, color: '#F0F0F0' }}>
              Built for <span style={{ color: '#00E676' }}>real</span> connections
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
            {features.map((f, i) => (
              <div key={i} style={{
                background: '#161618',
                border: '1px solid #1E1E22',
                borderRadius: 16,
                padding: 28,
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
                transition: 'border-color 0.2s',
              }}>
                {f.icon}
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700, color: '#F0F0F0' }}>
                  {f.title}
                </h3>
                <p style={{ fontSize: 14, color: '#8A8A8E', lineHeight: 1.65 }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Social Proof (user-facing stats) ──────────────────── */}
      <section style={{ padding: '80px 48px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 32, maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          {[
            { value: '10K+', label: 'Real connections made' },
            { value: '5', label: 'Compatibility dimensions' },
            { value: '4-Tier', label: 'Verification system' },
            { value: '89%', label: 'Match satisfaction rate' },
          ].map((stat, i) => (
            <div key={i}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(32px, 4vw, 44px)', fontWeight: 700, color: '#00E676', lineHeight: 1.1 }}>
                {stat.value}
              </div>
              <div style={{ fontSize: 14, color: '#8A8A8E', marginTop: 8 }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────── */}
      <section id="pricing" style={{ padding: '100px 48px', backgroundColor: '#111113', borderTop: '1px solid #1E1E22', borderBottom: '1px solid #1E1E22' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <div style={{ fontSize: 12, color: '#5A5A5E', fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>Pricing</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 3.5vw, 40px)', fontWeight: 700, color: '#F0F0F0' }}>
              Simple, <span style={{ color: '#00E676' }}>honest</span> pricing
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20, alignItems: 'start' }}>
            {/* Free */}
            <div style={{ background: '#161618', border: '1px solid #1E1E22', borderRadius: 16, padding: 32, textAlign: 'center' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: '#F0F0F0', marginBottom: 4 }}>Free</h3>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 40, fontWeight: 700, color: '#F0F0F0', marginBottom: 24 }}>$0</div>
              <ul style={{ listStyle: 'none', padding: 0, marginBottom: 28, textAlign: 'left' }}>
                {['10 curated matches/day', 'Basic profile & messaging', 'Standard filters', 'AI compatibility scores'].map(f => (
                  <li key={f} style={{ padding: '10px 0', borderBottom: '1px solid #1E1E22', color: '#8A8A8E', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: '#00E676', fontSize: 16 }}>✓</span> {f}
                  </li>
                ))}
              </ul>
              <a href="https://play.google.com/store/apps/details?id=com.spark.dating" target="_blank" rel="noopener noreferrer" style={{ display: 'block', width: '100%', padding: 14, backgroundColor: '#1C1C1C', color: '#F0F0F0', border: '1px solid #2A2A2A', borderRadius: 10, fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-display)', textAlign: 'center', textDecoration: 'none' }}>
                Get Started
              </a>
            </div>

            {/* Spark+ */}
            <div style={{ background: '#161618', border: '2px solid #00E676', borderRadius: 16, padding: 32, textAlign: 'center', position: 'relative', boxShadow: '0 0 40px rgba(0,230,118,0.08)' }}>
              <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', backgroundColor: '#00E676', color: '#000', padding: '4px 14px', borderRadius: 20, fontSize: 11, fontWeight: 800, letterSpacing: 0.5 }}>
                MOST POPULAR
              </div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: '#F0F0F0', marginBottom: 4 }}>Spark+</h3>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 40, fontWeight: 700, color: '#00E676', marginBottom: 4 }}>$5.99</div>
              <div style={{ fontSize: 13, color: '#5A5A5E', marginBottom: 24 }}>per month</div>
              <ul style={{ listStyle: 'none', padding: 0, marginBottom: 28, textAlign: 'left' }}>
                {['Unlimited matches', 'Advanced filters', 'See who liked you', '5 Super Sparks/day', '1 weekly boost'].map(f => (
                  <li key={f} style={{ padding: '10px 0', borderBottom: '1px solid #1E1E22', color: '#8A8A8E', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: '#00E676', fontSize: 16 }}>✓</span> {f}
                  </li>
                ))}
              </ul>
              <a href="https://play.google.com/store/apps/details?id=com.spark.dating" target="_blank" rel="noopener noreferrer" style={{ display: 'block', width: '100%', padding: 14, backgroundColor: '#00E676', color: '#000', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 800, fontFamily: 'var(--font-display)', textAlign: 'center', textDecoration: 'none' }}>
                Subscribe — $5.99/mo
              </a>
              <div style={{ fontSize: 12, color: '#5A5A5E', marginTop: 10 }}>Annual: $50.39/yr (30% off)</div>
            </div>

            {/* Spark Elite */}
            <div style={{ background: '#161618', border: '1px solid #1E1E22', borderRadius: 16, padding: 32, textAlign: 'center' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: '#F0F0F0', marginBottom: 4 }}>Spark Elite</h3>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 40, fontWeight: 700, color: '#7C4DFF', marginBottom: 4 }}>$10.99</div>
              <div style={{ fontSize: 13, color: '#5A5A5E', marginBottom: 24 }}>per month</div>
              <ul style={{ listStyle: 'none', padding: 0, marginBottom: 28, textAlign: 'left' }}>
                {['Everything in Spark+', 'Priority profile placement', 'Incognito mode', 'AI Date Planner', 'Message before matching', 'Unlimited Super Sparks'].map(f => (
                  <li key={f} style={{ padding: '10px 0', borderBottom: '1px solid #1E1E22', color: '#8A8A8E', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: '#7C4DFF', fontSize: 16 }}>✓</span> {f}
                  </li>
                ))}
              </ul>
              <a href="https://play.google.com/store/apps/details?id=com.spark.dating" target="_blank" rel="noopener noreferrer" style={{ display: 'block', width: '100%', padding: 14, backgroundColor: 'transparent', color: '#7C4DFF', border: '1px solid #7C4DFF', borderRadius: 10, fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-display)', textAlign: 'center', textDecoration: 'none' }}>
                Subscribe — $10.99/mo
              </a>
              <div style={{ fontSize: 12, color: '#5A5A5E', marginTop: 10 }}>Annual: $92.39/yr (30% off)</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section style={{ padding: '100px 48px', textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 3.5vw, 40px)', fontWeight: 700, marginBottom: 16, color: '#F0F0F0' }}>
          Ready to find your <span style={{ color: '#00E676' }}>spark</span>?
        </h2>
        <p style={{ fontSize: 17, color: '#8A8A8E', marginBottom: 36, maxWidth: 460, margin: '0 auto 36px' }}>
          Join thousands of people finding meaningful connections with AI-powered matching.
        </p>
        <a href="https://play.google.com/store/apps/details?id=com.spark.dating" target="_blank" rel="noopener noreferrer" style={{
          backgroundColor: '#00E676',
          color: '#000',
          padding: '16px 40px',
          borderRadius: 12,
          fontSize: 16,
          fontWeight: 700,
          fontFamily: 'var(--font-display)',
          display: 'inline-block',
          textDecoration: 'none',
        }}>
          Download Spark Free
        </a>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer style={{
        backgroundColor: '#111113',
        borderTop: '1px solid #1E1E22',
        padding: '60px 48px 32px',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 40, paddingBottom: 40, borderBottom: '1px solid #1E1E22' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: '#00E676', marginBottom: 12 }}>Spark</div>
            <p style={{ fontSize: 13, color: '#5A5A5E', lineHeight: 1.6 }}>AI-powered dating that helps you find meaningful connections based on deep compatibility.</p>
          </div>
          {[
            { title: 'Product', links: [{ text: 'Features', href: '#features' }, { text: 'Pricing', href: '#pricing' }, { text: 'Safety', href: '#features' }] },
            { title: 'Company', links: [{ text: 'About', href: '#' }, { text: 'Blog', href: '#' }, { text: 'Careers', href: '#' }] },
            { title: 'Legal', links: [{ text: 'Privacy Policy', href: '/privacy' }, { text: 'Terms of Service', href: '/terms' }, { text: 'No Refund Policy', href: '/norefund' }, { text: 'Community Guidelines', href: '/guidelines' }, { text: 'DPO Contact', href: '/dpo' }, { text: 'Data Processing', href: '/processing' }] },
          ].map(col => (
            <div key={col.title}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#F0F0F0', marginBottom: 14, textTransform: 'uppercase', letterSpacing: 1 }}>{col.title}</div>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {col.links.map((link: any) => (
                  <li key={link.text} style={{ padding: '4px 0' }}>
                    <a href={link.href} style={{ color: '#8A8A8E', fontSize: 13, transition: 'color 0.2s', textDecoration: 'none' }}>{link.text}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', color: '#3A3A3E', fontSize: 13, marginTop: 24 }}>
          © 2026 Spark Dating App. All rights reserved.
        </div>
      </footer>
    </main>
  )
}
