import React from 'react';

export default function NoRefundPolicyPage() {
  return (
    <main style={{ backgroundColor: '#0A0A0A', minHeight: '100vh', color: '#E0E0E0' }}>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '80px 24px 120px' }}>
        <div style={{ marginBottom: 48 }}>
          <a href="/" style={{ color: '#00E676', fontSize: 14, textDecoration: 'none', marginBottom: 24, display: 'inline-block' }}>
            ← Back to Spark
          </a>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 700, color: '#F0F0F0', marginBottom: 12 }}>
            No Refund Policy
          </h1>
          <p style={{ fontSize: 14, color: '#5A5A5E' }}>Last updated: August 25, 2026</p>
        </div>

        <div style={{ fontSize: 15, lineHeight: 1.8, color: '#A0A0A0' }}>
          <div style={{ padding: 20, background: '#1C1C1C', borderRadius: 12, border: '1px solid #2A2A2A', marginBottom: 40 }}>
            <p style={{ fontSize: 16, color: '#F0F0F0', fontWeight: 600, margin: 0 }}>
              All purchases made through Spark are final and non-refundable.
            </p>
          </div>

          <section style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#F0F0F0', marginBottom: 16 }}>General Policy</h2>
            <p style={{ marginBottom: 12 }}>
              Spark does not offer refunds for any purchases made through the app, including but not limited to subscriptions, consumable items, boosts, and Super Sparks. All sales are final.
            </p>
          </section>

          <section style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#F0F0F0', marginBottom: 16 }}>Subscriptions</h2>
            <p style={{ marginBottom: 12 }}>
              Subscription payments (Spark+ and Spark Elite) are non-refundable. If you cancel your subscription, you will continue to have access until the end of your current billing period. No partial refunds will be issued for unused time.
            </p>
            <p style={{ marginBottom: 12 }}>
              Subscriptions automatically renew at the end of each billing period unless cancelled at least 24 hours before the renewal date through your App Store or Google Play account settings.
            </p>
          </section>

          <section style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#F0F0F0', marginBottom: 16 }}>Consumable Items</h2>
            <p style={{ marginBottom: 12 }}>
              Purchases of boosts, Super Sparks, and other consumable items are non-refundable once delivered to your account. Consumable items do not expire and remain available for use.
            </p>
          </section>

          <section style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#F0F0F0', marginBottom: 16 }}>How to Cancel</h2>
            <p style={{ marginBottom: 12 }}>To cancel your subscription:</p>
            <ul style={{ paddingLeft: 24, marginBottom: 12 }}>
              <li style={{ marginBottom: 8 }}><strong style={{ color: '#F0F0F0' }}>iOS:</strong> Go to Settings → [Your Name] → Subscriptions → Spark → Cancel.</li>
              <li style={{ marginBottom: 8 }}><strong style={{ color: '#F0F0F0' }}>Android:</strong> Open Google Play Store → Menu → Subscriptions → Spark → Cancel.</li>
            </ul>
            <p>Cancelling stops future charges but does not generate a refund for the current period.</p>
          </section>

          <section style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#F0F0F0', marginBottom: 16 }}>Exceptions</h2>
            <p style={{ marginBottom: 12 }}>
              Refunds may only be considered in the following exceptional circumstances:
            </p>
            <ul style={{ paddingLeft: 24, marginBottom: 12 }}>
              <li style={{ marginBottom: 8 }}>Accidental duplicate charges by the payment processor.</li>
              <li style={{ marginBottom: 8 }}>Technical issues that prevent the service from being accessible for an extended period (7+ consecutive days) with no resolution provided.</li>
              <li style={{ marginBottom: 8 }}>Charges made by unauthorized parties using your account.</li>
            </ul>
            <p>To request a refund under these circumstances, contact <a href="mailto:support@spark.dating" style={{ color: '#00E676' }}>support@spark.dating</a> within 14 days of the charge.</p>
          </section>

          <section style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#F0F0F0', marginBottom: 16 }}>Platform Disputes</h2>
            <p style={{ marginBottom: 12 }}>
              For payment-related issues, you may also contact Apple (for iOS) or Google (for Android) directly through their respective support channels. Refund decisions by platform providers are final.
            </p>
          </section>

          <section style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#F0F0F0', marginBottom: 16 }}>Contact</h2>
            <p>
              Questions about this policy? Contact us at{' '}
              <a href="mailto:billing@spark.dating" style={{ color: '#00E676' }}>billing@spark.dating</a>.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
