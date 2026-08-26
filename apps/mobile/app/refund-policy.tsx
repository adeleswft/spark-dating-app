import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import { useRouter } from 'expo-router';

export default function RefundPolicyScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <IconButton icon="arrow-left" size={24} onPress={() => router.back()} />
        <Text variant="titleLarge" style={styles.headerTitle}>
          No Refund Policy
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.effectiveDate}>Effective Date: August 25, 2026</Text>

        <Text style={styles.sectionTitle}>All Sales Are Final</Text>
        <Text style={styles.body}>
          All purchases made within the Spark Dating application, including but not limited to
          subscriptions (Spark+, Spark Elite), consumable items (Boosts, Super Sparks), and any
          other in-app purchases, are final. Spark Dating does not issue refunds for any
          purchases under any circumstances.
        </Text>

        <Text style={styles.sectionTitle}>Subscriptions</Text>
        <Text style={styles.body}>
          Subscription payments are non-refundable. When you subscribe to Spark+ or Spark Elite,
          your payment is processed immediately and cannot be reversed. Subscriptions
          auto-renew at the end of each billing period unless cancelled at least 24 hours
          before the renewal date.
        </Text>

        <Text style={styles.sectionTitle}>Consumable Purchases</Text>
        <Text style={styles.body}>
          Purchases of consumable items such as Boosts and Super Sparks are final and
          non-refundable. Once consumed or added to your account, these items cannot be
          returned or refunded.
        </Text>

        <Text style={styles.sectionTitle}>How to Cancel</Text>
        <Text style={styles.body}>
          While we do not offer refunds, you may cancel your subscription at any time to
          prevent future charges. Cancellation takes effect at the end of the current billing
          period. You will continue to have access to your subscription features until that
          time.
        </Text>

        <Text style={styles.sectionTitle}>Exceptions</Text>
        <Text style={styles.body}>
          If you experience a technical issue that prevents you from using a purchased feature,
          please contact our support team at support@sparkdating.com. While we do not offer
          refunds, we will work to resolve any technical issues promptly.
        </Text>

        <Text style={styles.sectionTitle}>Platform Disputes</Text>
        <Text style={styles.body}>
          If you seek a refund through Apple App Store or Google Play Store, please note that
          refund policies are governed by the respective platform's terms of service. Spark
          Dating is not responsible for refunds processed through third-party platforms.
        </Text>

        <Text style={styles.sectionTitle}>Contact Us</Text>
        <Text style={styles.body}>
          If you have questions about this policy, please contact us at
          support@sparkdating.com.
        </Text>

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 8,
    backgroundColor: '#141414',
  },
  headerTitle: {
    fontWeight: 'bold',
    color: '#FFF',
  },
  content: {
    padding: 20,
  },
  effectiveDate: {
    fontSize: 13,
    color: '#555',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFF',
    marginTop: 20,
    marginBottom: 8,
  },
  body: {
    fontSize: 15,
    color: '#A0A0A0',
    lineHeight: 22,
  },
});
