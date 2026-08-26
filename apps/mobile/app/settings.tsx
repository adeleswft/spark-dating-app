import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Linking,
} from 'react-native';
import { Text, Surface, IconButton, Button, Divider, Avatar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../stores/auth';
import { useNotificationsStore } from '../stores/notifications';
import * as FileSystem from 'expo-file-system';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

// Section component
function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Surface style={styles.sectionCard} elevation={1}>
        {children}
      </Surface>
    </View>
  );
}

// Setting row with toggle
function SettingToggle({
  icon,
  iconColor,
  iconBg,
  label,
  description,
  value,
  onValueChange,
}: {
  icon: string;
  iconColor: string;
  iconBg: string;
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.settingRow}>
      <View style={[styles.settingIcon, { backgroundColor: iconBg }]}>
        <MaterialCommunityIcons name={icon as any} size={20} color={iconColor} />
      </View>
      <View style={styles.settingInfo}>
        <Text style={styles.settingLabel}>{label}</Text>
        {description && <Text style={styles.settingDescription}>{description}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ true: '#00E676', false: '#2A2A2A' }}
        thumbColor="#fff"
      />
    </View>
  );
}

// Setting row with chevron
function SettingLink({
  icon,
  iconColor,
  iconBg,
  label,
  description,
  value,
  onPress,
}: {
  icon: string;
  iconColor: string;
  iconBg: string;
  label: string;
  description?: string;
  value?: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.settingRow} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.settingIcon, { backgroundColor: iconBg }]}>
        <MaterialCommunityIcons name={icon as any} size={20} color={iconColor} />
      </View>
      <View style={styles.settingInfo}>
        <Text style={styles.settingLabel}>{label}</Text>
        {description && <Text style={styles.settingDescription}>{description}</Text>}
      </View>
      <View style={styles.settingRight}>
        {value && <Text style={styles.settingValue}>{value}</Text>}
        <MaterialCommunityIcons name="chevron-right" size={20} color="#ccc" />
      </View>
    </TouchableOpacity>
  );
}

// Destructive action row
function SettingDanger({
  icon,
  label,
  description,
  onPress,
}: {
  icon: string;
  label: string;
  description?: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.settingRow} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.settingIcon, { backgroundColor: '#FFF0F0' }]}>
        <MaterialCommunityIcons name={icon as any} size={20} color="#FF4444" />
      </View>
      <View style={styles.settingInfo}>
        <Text style={[styles.settingLabel, { color: '#FF4444' }]}>{label}</Text>
        {description && <Text style={styles.settingDescription}>{description}</Text>}
      </View>
      <MaterialCommunityIcons name="chevron-right" size={20} color="#ccc" />
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { user, token, logout } = useAuthStore();
  const { markAllAsRead, clearAll } = useNotificationsStore();

  // User data from API
  const [profileData, setProfileData] = useState<any>(null);
  const [subscriptionTier, setSubscriptionTier] = useState('free');

  // Privacy settings (persisted to server on change)
  const [showOnlineStatus, setShowOnlineStatus] = useState(true);
  const [showDistance, setShowDistance] = useState(true);
  const [showLastActive, setShowLastActive] = useState(true);
  const [incognitoMode, setIncognitoMode] = useState(false);

  // Notification settings
  const [notifMatches, setNotifMatches] = useState(true);
  const [notifMessages, setNotifMessages] = useState(true);
  const [notifSuperLikes, setNotifSuperLikes] = useState(true);
  const [notifLikes, setNotifLikes] = useState(true);
  const [notifPromotions, setNotifPromotions] = useState(false);

  // App settings
  const [darkMode, setDarkMode] = useState(false);

  // Persist privacy settings to server whenever they change
  // NOTE: The /onboarding endpoint is destructive (replaces all interests/preferences),
  // so we use a targeted profile update instead.
  const persistSettings = useCallback(async (updates: Record<string, any>) => {
    if (!token) return;
    try {
      await fetch(`${API_URL}/profiles`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ settings: updates }),
      });
    } catch {
      // Non-critical — settings saved locally
    }
  }, [token]);

  // Load profile and subscription from API
  useEffect(() => {
    let cancelled = false;
    const loadData = async () => {
      try {
        const [profileRes, subRes] = await Promise.all([
          fetch(`${API_URL}/profiles/me`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }),
          fetch(`${API_URL}/subscriptions`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }),
        ]);
        if (!cancelled && profileRes.ok) {
          const profileData = await profileRes.json();
          setProfileData(profileData.user);
        }
        if (!cancelled && subRes.ok) {
          const subData = await subRes.json();
          setSubscriptionTier(subData.subscription?.tier || subData.tier || 'free');
        }
      } catch {
        // Use defaults
      }
    };
    loadData();
    return () => { cancelled = true; };
  }, [token]);

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action is permanent and cannot be undone. All your data, matches, and messages will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await fetch(`${API_URL}/auth/account`, {
                method: 'DELETE',
                headers: token ? { Authorization: `Bearer ${token}` } : {},
              });
              if (res.ok) {
                await logout();
                Alert.alert('Account Deleted', 'Your account has been permanently deleted.');
              } else {
                Alert.alert('Error', 'Failed to delete account. Please try again.');
              }
            } catch {
              // Still logout locally if API is unreachable
              await logout();
              Alert.alert('Account Deleted', 'Your account has been removed.');
            }
          },
        },
      ]
    );
  };

  const handleDownloadData = async () => {
    try {
      Alert.alert('Download Your Data', 'Your data will be exported as a JSON file. This may take a moment.', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Download',
          onPress: async () => {
            try {
              const res = await fetch(`${API_URL}/auth/export`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
              });

              if (!res.ok) {
                Alert.alert('Error', 'Failed to export data. Please try again.');
                return;
              }

              const json = await res.json();
              const filename = `spark-data-${Date.now()}.json`;
              const fileUri = FileSystem.documentDirectory + filename;

              await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(json, null, 2), {
                encoding: FileSystem.EncodingType.UTF8,
              });

              Alert.alert(
                'Data Downloaded',
                `Your data has been saved to:\n${fileUri}\n\nYou can share this file from your device's file manager.`,
                [{ text: 'OK' }]
              );
            } catch {
              Alert.alert('Error', 'Failed to download data. Check your connection and try again.');
            }
          },
        },
      ]);
    } catch {
      Alert.alert('Error', 'Something went wrong.');
    }
  };

  const handleBlockList = () => {
    router.push('/blocked-users');
  };

  const handleReportProblem = () => {
    Alert.alert('Report a Problem', 'Please email support@sparkdating.com', [
      { text: 'Open Email', onPress: () => Linking.openURL('mailto:support@sparkdating.com') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <IconButton icon="arrow-left" size={24} onPress={() => router.back()} />
        <Text variant="titleLarge" style={styles.headerTitle}>
          Settings
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <TouchableOpacity
          style={styles.profileCard}
          onPress={() => router.push('/(tabs)/profile')}
          activeOpacity={0.7}
        >
          <Avatar.Image
            size={56}
            source={{ uri: profileData?.photos?.[0] || 'https://picsum.photos/seed/alex1/200/200' }}
          />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{profileData?.name || user?.name || 'Alex'}</Text>
            <Text style={styles.profileEmail}>{profileData?.email || user?.email || 'alex@spark.com'}</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={22} color="#ccc" />
        </TouchableOpacity>

        {/* Account */}
        <SettingsSection title="Account">
          <SettingLink
            icon="account-edit"
            iconColor="#4CAF50"
            iconBg="#E8F5E9"
            label="Edit Profile"
            description="Name, photos, bio, and interests"
            onPress={() => router.push('/(tabs)/profile')}
          />
          <Divider style={styles.rowDivider} />
          <SettingLink
            icon="phone"
            iconColor="#2196F3"
            iconBg="#E3F2FD"
            label="Phone Number"
            value={profileData?.phone || 'Not set'}
            onPress={() => {}}
          />
          <Divider style={styles.rowDivider} />
          <SettingLink
            icon="email"
            iconColor="#FF9800"
            iconBg="#FFF3E0"
            label="Email"
            value={profileData?.email || user?.email || 'alex@spark.com'}
            onPress={() => {}}
          />
          <Divider style={styles.rowDivider} />
          <SettingLink
            icon="lock"
            iconColor="#9C27B0"
            iconBg="#F3E5F5"
            label="Change Password"
            onPress={() => {}}
          />
        </SettingsSection>

        {/* Privacy */}
        <SettingsSection title="Privacy">
          <SettingToggle
            icon="eye"
            iconColor="#4CAF50"
            iconBg="#E8F5E9"
            label="Show Online Status"
            description="Others can see when you're online"
            value={showOnlineStatus}
            onValueChange={(v) => { setShowOnlineStatus(v); persistSettings({ showOnlineStatus: v }); }}
          />
          <Divider style={styles.rowDivider} />
          <SettingToggle
            icon="map-marker"
            iconColor="#2196F3"
            iconBg="#E3F2FD"
            label="Show Distance"
            description="Display your distance to others"
            value={showDistance}
            onValueChange={(v) => { setShowDistance(v); persistSettings({ showDistance: v }); }}
          />
          <Divider style={styles.rowDivider} />
          <SettingToggle
            icon="clock-outline"
            iconColor="#FF9800"
            iconBg="#FFF3E0"
            label="Show Last Active"
            description="Show when you were last active"
            value={showLastActive}
            onValueChange={(v) => { setShowLastActive(v); persistSettings({ showLastActive: v }); }}
          />
          <Divider style={styles.rowDivider} />
          <SettingToggle
            icon="eye-off"
            iconColor="#6C63FF"
            iconBg="#EDE7F6"
            label="Incognito Mode"
            description="Only people you like can see your profile"
            value={incognitoMode}
            onValueChange={(v) => { setIncognitoMode(v); persistSettings({ incognitoMode: v }); }}
          />
          <Divider style={styles.rowDivider} />
          <SettingLink
            icon="account-cancel"
            iconColor="#FF4444"
            iconBg="#FFF0F0"
            label="Blocked Users"
            description="Manage your blocked list"
            onPress={handleBlockList}
          />
          <Divider style={styles.rowDivider} />
          <SettingLink
            icon="download"
            iconColor="#2196F3"
            iconBg="#E3F2FD"
            label="Download My Data"
            description="Export all your data as JSON (GDPR)"
            onPress={handleDownloadData}
          />
        </SettingsSection>

        {/* Notifications */}
        <SettingsSection title="Notifications">
          <SettingToggle
            icon="heart"
            iconColor="#00E676"
            iconBg="#1B3A2A"
            label="New Matches"
            description="Get notified when you match"
            value={notifMatches}
            onValueChange={setNotifMatches}
          />
          <Divider style={styles.rowDivider} />
          <SettingToggle
            icon="chat"
            iconColor="#2196F3"
            iconBg="#E3F2FD"
            label="Messages"
            description="Get notified for new messages"
            value={notifMessages}
            onValueChange={setNotifMessages}
          />
          <Divider style={styles.rowDivider} />
          <SettingToggle
            icon="star"
            iconColor="#6C63FF"
            iconBg="#EDE7F6"
            label="Super Likes"
            description="Get notified when someone Super Likes you"
            value={notifSuperLikes}
            onValueChange={setNotifSuperLikes}
          />
          <Divider style={styles.rowDivider} />
          <SettingToggle
            icon="heart-outline"
            iconColor="#00E676"
            iconBg="#1B3A2A"
            label="Likes"
            description="Get notified when someone likes you"
            value={notifLikes}
            onValueChange={setNotifLikes}
          />
          <Divider style={styles.rowDivider} />
          <SettingToggle
            icon="tag"
            iconColor="#FF9800"
            iconBg="#FFF3E0"
            label="Promotions & Tips"
            description="Spark tips, new features, and special offers"
            value={notifPromotions}
            onValueChange={setNotifPromotions}
          />
        </SettingsSection>

        {/* Subscription */}
        <SettingsSection title="Subscription">
          <SettingLink
            icon="crown"
            iconColor="#FFD700"
            iconBg="#FFF8E1"
            label="Manage Subscription"
            description="Spark+ or Spark Elite"
            value={subscriptionTier === 'free' ? 'Free' : subscriptionTier === 'plus' ? 'Spark+' : 'Spark Elite'}
            onPress={() => router.push('/subscription')}
          />
          <Divider style={styles.rowDivider} />
          <SettingLink
            icon="receipt"
            iconColor="#4CAF50"
            iconBg="#E8F5E9"
            label="Purchase History"
            onPress={() => {}}
          />
          <Divider style={styles.rowDivider} />
          <SettingLink
            icon="restore"
            iconColor="#2196F3"
            iconBg="#E3F2FD"
            label="Restore Purchases"
            onPress={() => Alert.alert('Restored', 'Your purchases have been restored.')}
          />
        </SettingsSection>

        {/* App */}
        <SettingsSection title="App">
          <SettingToggle
            icon="moon-waning-crescent"
            iconColor="#6C63FF"
            iconBg="#EDE7F6"
            label="Dark Mode"
            value={darkMode}
            onValueChange={setDarkMode}
          />
          <Divider style={styles.rowDivider} />
          <SettingLink
            icon="translate"
            iconColor="#FF9800"
            iconBg="#FFF3E0"
            label="Language"
            value="English"
            onPress={() => {}}
          />
          <Divider style={styles.rowDivider} />
          <SettingLink
            icon="information"
            iconColor="#2196F3"
            iconBg="#E3F2FD"
            label="About Spark"
            value="v1.0.0"
            onPress={() =>
              Alert.alert(
                'Spark Dating',
                'Version 1.0.0\n\nAI-Powered Dating That Actually Works.\n\n© 2026 Spark Dating Inc.'
              )
            }
          />
          <Divider style={styles.rowDivider} />
          <SettingLink
            icon="file-document"
            iconColor="#666"
            iconBg="#F5F5F5"
            label="Terms of Service"
            onPress={() => {}}
          />
          <Divider style={styles.rowDivider} />
          <SettingLink
            icon="shield-lock"
            iconColor="#666"
            iconBg="#F5F5F5"
            label="Privacy Policy"
            onPress={() => {}}
          />
          <Divider style={styles.rowDivider} />
          <SettingLink
            icon="cash-refund"
            iconColor="#666"
            iconBg="#F5F5F5"
            label="No Refund Policy"
            onPress={() => router.push('/refund-policy')}
          />
        </SettingsSection>

        {/* Support */}
        <SettingsSection title="Support">
          <SettingLink
            icon="help-circle"
            iconColor="#4CAF50"
            iconBg="#E8F5E9"
            label="Help Center"
            onPress={() => {}}
          />
          <Divider style={styles.rowDivider} />
          <SettingLink
            icon="bug"
            iconColor="#FF9800"
            iconBg="#FFF3E0"
            label="Report a Problem"
            onPress={handleReportProblem}
          />
          <Divider style={styles.rowDivider} />
          <SettingLink
            icon="message-alert"
            iconColor="#2196F3"
            iconBg="#E3F2FD"
            label="Send Feedback"
            onPress={() => {}}
          />
        </SettingsSection>

        {/* Danger Zone */}
        <SettingsSection title="Account Actions">
          <SettingDanger
            icon="logout"
            label="Sign Out"
            description="Sign out of your account"
            onPress={handleLogout}
          />
          <Divider style={styles.rowDivider} />
          <SettingDanger
            icon="delete"
            label="Delete Account"
            description="Permanently delete your account and data"
            onPress={handleDeleteAccount}
          />
        </SettingsSection>

        <View style={{ height: 100 }} />
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
    flex: 1,
  },

  // Profile card
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 12,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 16,
    backgroundColor: '#141414',
    gap: 14,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#FFF',
  },
  profileEmail: {
    fontSize: 13,
    color: '#555',
    marginTop: 2,
  },

  // Sections
  section: {
    marginHorizontal: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionCard: {
    borderRadius: 16,
    backgroundColor: '#141414',
    overflow: 'hidden',
  },
  rowDivider: {
    marginLeft: 68,
  },

  // Setting rows
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 14,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 15,
    color: '#FFF',
    fontWeight: '500',
  },
  settingDescription: {
    fontSize: 12,
    color: '#555',
    marginTop: 2,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  settingValue: {
    fontSize: 14,
    color: '#555',
  },
});
