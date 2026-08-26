import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  Dimensions,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Text, Button, IconButton, Surface, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

interface ReportBlockModalProps {
  visible: boolean;
  profileName: string;
  profileId: string;
  onClose: () => void;
  onReport?: (reason: string, description: string) => void;
  onBlock?: (profileId: string) => void;
  authToken?: string;
}

interface ReportReason {
  id: string;
  label: string;
  icon: string;
  color: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

const REPORT_REASONS: ReportReason[] = [
  {
    id: 'fake-profile',
    label: 'Fake profile / Catfishing',
    icon: 'account-alert',
    color: '#FF4444',
    description: 'This person is pretending to be someone they\'re not',
    severity: 'high',
  },
  {
    id: 'inappropriate',
    label: 'Inappropriate content',
    icon: 'alert-octagon',
    color: '#FF9800',
    description: 'Nudity, sexual content, or explicit material',
    severity: 'high',
  },
  {
    id: 'harassment',
    label: 'Harassment or bullying',
    icon: 'message-alert',
    color: '#FF4444',
    description: 'Threatening, abusive, or bullying messages',
    severity: 'critical',
  },
  {
    id: 'spam',
    label: 'Spam or scam',
    icon: 'robot',
    color: '#FF9800',
    description: 'Advertising, soliciting money, or bot behavior',
    severity: 'medium',
  },
  {
    id: 'underage',
    label: 'Underage user',
    icon: 'alert',
    color: '#FF4444',
    description: 'This person appears to be under 18',
    severity: 'critical',
  },
  {
    id: 'offensive',
    label: 'Offensive language',
    icon: 'text-box-remove',
    color: '#FF9800',
    description: 'Hate speech, slurs, or discriminatory content',
    severity: 'high',
  },
  {
    id: 'violence',
    label: 'Violence or threats',
    icon: 'sword',
    color: '#FF4444',
    description: 'References to violence or threatening behavior',
    severity: 'critical',
  },
  {
    id: 'other',
    label: 'Other',
    icon: 'dots-horizontal',
    color: '#555',
    description: 'Something else that violates our guidelines',
    severity: 'low',
  },
];

// Severity badge component
function SeverityBadge({ severity }: { severity: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    low: { bg: '#F5F5F5', text: '#999' },
    medium: { bg: '#FFF3E0', text: '#FF9800' },
    high: { bg: '#FFF0F0', text: '#FF4444' },
    critical: { bg: '#FFEBEE', text: '#D32F2F' },
  };
  const c = colors[severity] || colors.low;

  return (
    <View style={[styles.severityBadge, { backgroundColor: c.bg }]}>
      <Text style={[styles.severityText, { color: c.text }]}>{severity}</Text>
    </View>
  );
}

type FlowState = 'reasons' | 'details' | 'block-confirm' | 'report-confirm' | 'success';

export default function ReportBlockModal({
  visible,
  profileName,
  profileId,
  onClose,
  onReport,
  onBlock,
  authToken,
}: ReportBlockModalProps) {
  const [flow, setFlow] = useState<FlowState>('reasons');
  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null);
  const [description, setDescription] = useState('');
  const [blockAlso, setBlockAlso] = useState(true);
  const [successType, setSuccessType] = useState<'report' | 'block'>('report');

  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    if (visible) {
      // Reset
      setFlow('reasons');
      setSelectedReason(null);
      setDescription('');
      setBlockAlso(true);

      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(contentTranslateY, {
          toValue: 0,
          tension: 80,
          friction: 12,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(contentTranslateY, {
          toValue: SCREEN_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleReasonSelect = (reason: ReportReason) => {
    setSelectedReason(reason);
    setFlow('details');
  };

  const apiCall = async (path: string, method: string, body?: any) => {
    try {
      const res = await fetch(`${API_URL}${path}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      return res.ok;
    } catch {
      return false;
    }
  };

  const handleSubmitReport = async () => {
    if (selectedReason) {
      // Call real API
      await apiCall('/safety/report', 'POST', {
        reportedId: profileId,
        reason: selectedReason.id,
        description,
        severity: selectedReason.severity,
      });
      onReport?.(selectedReason.id, description);
    }

    if (blockAlso) {
      setFlow('block-confirm');
    } else {
      setSuccessType('report');
      setFlow('success');
    }
  };

  const handleBlock = async () => {
    await apiCall('/safety/block', 'POST', { blockedId: profileId });
    onBlock?.(profileId);
    setSuccessType('block');
    setFlow('success');
  };

  const handleBlockOnly = async () => {
    await apiCall('/safety/block', 'POST', { blockedId: profileId });
    onBlock?.(profileId);
    setSuccessType('block');
    setFlow('success');
  };

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(overlayOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(contentTranslateY, { toValue: SCREEN_HEIGHT, duration: 250, useNativeDriver: true }),
    ]).start(() => onClose());
  };

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} onRequestClose={handleClose}>
      {/* Overlay */}
      <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]} />

      {/* Bottom sheet */}
      <Animated.View
        style={[
          styles.sheet,
          { transform: [{ translateY: contentTranslateY }] },
        ]}
      >
        {/* Handle */}
        <View style={styles.handle} />

        {/* Content */}
        <ScrollView style={styles.sheetContent} showsVerticalScrollIndicator={false}>
          {flow === 'reasons' && (
            <View>
              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>Report {profileName}</Text>
                <Text style={styles.sheetSubtitle}>
                  Why are you reporting this profile?
                </Text>
              </View>

              {REPORT_REASONS.map((reason) => (
                <TouchableOpacity
                  key={reason.id}
                  style={styles.reasonItem}
                  onPress={() => handleReasonSelect(reason)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.reasonIcon, { backgroundColor: reason.color + '15' }]}>
                    <MaterialCommunityIcons name={reason.icon as any} size={22} color={reason.color} />
                  </View>
                  <View style={styles.reasonInfo}>
                    <View style={styles.reasonHeader}>
                      <Text style={styles.reasonLabel}>{reason.label}</Text>
                      <SeverityBadge severity={reason.severity} />
                    </View>
                    <Text style={styles.reasonDesc}>{reason.description}</Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={20} color="#ccc" />
                </TouchableOpacity>
              ))}

              <Divider style={styles.divider} />

              {/* Block only option */}
              <TouchableOpacity
                style={styles.blockOnlyItem}
                onPress={handleBlockOnly}
                activeOpacity={0.7}
              >
                <View style={[styles.reasonIcon, { backgroundColor: '#FFF0F0' }]}>
                  <MaterialCommunityIcons name="account-cancel" size={22} color="#FF4444" />
                </View>
                <View style={styles.reasonInfo}>
                  <Text style={[styles.reasonLabel, { color: '#FF4444' }]}>
                    Block {profileName}
                  </Text>
                  <Text style={styles.reasonDesc}>
                    Hide their profile from you without reporting
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          )}

          {flow === 'details' && selectedReason && (
            <View>
              <View style={styles.sheetHeader}>
                <View style={styles.backRow}>
                  <IconButton icon="arrow-left" size={20} onPress={() => setFlow('reasons')} />
                  <Text style={styles.sheetTitle}>Report Details</Text>
                </View>
                <Text style={styles.sheetSubtitle}>
                  Selected: {selectedReason.label}
                </Text>
              </View>

              <View style={styles.selectedReasonCard}>
                <View style={[styles.reasonIcon, { backgroundColor: selectedReason.color + '15' }]}>
                  <MaterialCommunityIcons name={selectedReason.icon as any} size={22} color={selectedReason.color} />
                </View>
                <View style={styles.reasonInfo}>
                  <Text style={styles.reasonLabel}>{selectedReason.label}</Text>
                  <SeverityBadge severity={selectedReason.severity} />
                </View>
              </View>

              {/* Description */}
              <View style={styles.descriptionSection}>
                <Text style={styles.descriptionLabel}>
                  Additional details (optional)
                </Text>
                <TextInput
                  style={styles.descriptionInput}
                  placeholder="Describe the issue..."
                  placeholderTextColor="#999"
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={4}
                  maxLength={500}
                  textAlignVertical="top"
                />
                <Text style={styles.charCount}>{description.length}/500</Text>
              </View>

              {/* Block toggle */}
              <View style={styles.blockToggle}>
                <View style={styles.blockToggleInfo}>
                  <MaterialCommunityIcons name="account-cancel" size={20} color="#FF4444" />
                  <Text style={styles.blockToggleLabel}>Also block this person</Text>
                </View>
                <TouchableOpacity
                  style={[styles.toggle, blockAlso && styles.toggleActive]}
                  onPress={() => setBlockAlso(!blockAlso)}
                >
                  <View style={[styles.toggleDot, blockAlso && styles.toggleDotActive]} />
                </TouchableOpacity>
              </View>

              {/* Submit */}
              <Button
                mode="contained"
                onPress={handleSubmitReport}
                style={styles.submitButton}
                labelStyle={styles.submitButtonLabel}
              >
                Submit Report
              </Button>

              <Button
                mode="text"
                onPress={() => setFlow('reasons')}
                style={styles.cancelButton}
              >
                Go Back
              </Button>
            </View>
          )}

          {flow === 'block-confirm' && (
            <View style={styles.confirmContainer}>
              <View style={styles.confirmIcon}>
                <MaterialCommunityIcons name="account-cancel" size={48} color="#FF4444" />
              </View>
              <Text style={styles.confirmTitle}>Block {profileName}?</Text>
              <Text style={styles.confirmDesc}>
                They won't be able to see your profile, send you messages, or find you in search.
              </Text>

              <Button
                mode="contained"
                onPress={handleBlock}
                style={styles.blockButton}
                labelStyle={styles.blockButtonLabel}
              >
                Yes, Block
              </Button>
              <Button
                mode="text"
                onPress={() => {
                  setSuccessType('report');
                  setFlow('success');
                }}
                style={styles.cancelButton}
              >
                Skip, Report Only
              </Button>
            </View>
          )}

          {flow === 'success' && (
            <View style={styles.confirmContainer}>
              <View style={[styles.confirmIcon, { backgroundColor: '#F0FFF4' }]}>
                <MaterialCommunityIcons name="check-circle" size={48} color="#4CAF50" />
              </View>
              <Text style={styles.confirmTitle}>
                {successType === 'report' ? 'Report Submitted' : 'User Blocked'}
              </Text>
              <Text style={styles.confirmDesc}>
                {successType === 'report'
                  ? "Thank you for helping keep Spark safe. We'll review this report and take appropriate action."
                  : `${profileName} has been blocked and hidden from your matches.`}
              </Text>

              <Button
                mode="contained"
                onPress={handleClose}
                style={styles.doneButton}
                labelStyle={styles.doneButtonLabel}
              >
                Done
              </Button>
            </View>
          )}
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.85,
    backgroundColor: '#141414',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#1C1C1C',
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  sheetContent: {
    flex: 1,
  },
  sheetHeader: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  sheetSubtitle: {
    fontSize: 14,
    color: '#A0A0A0',
    marginTop: 4,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: -12,
    gap: 4,
  },

  // Reason items
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 14,
  },
  reasonIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reasonInfo: {
    flex: 1,
    gap: 2,
  },
  reasonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reasonLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#FFF',
  },
  reasonDesc: {
    fontSize: 12,
    color: '#555',
  },
  severityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  severityText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  divider: {
    marginVertical: 8,
    marginHorizontal: 20,
  },
  blockOnlyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 14,
  },

  // Details
  selectedReasonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#1C1C1C',
    gap: 12,
    marginBottom: 16,
  },
  descriptionSection: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  descriptionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 8,
  },
  descriptionInput: {
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: '#FFF',
    minHeight: 100,
    backgroundColor: '#141414',
  },
  charCount: {
    fontSize: 11,
    color: '#555',
    textAlign: 'right',
    marginTop: 4,
  },
  blockToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#FFF5F5',
    marginBottom: 20,
  },
  blockToggleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  blockToggleLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFF',
  },
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1C1C1C',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  toggleActive: {
    backgroundColor: '#00E676',
    alignItems: 'flex-end',
  },
  toggleDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#141414',
  },
  toggleDotActive: {},
  submitButton: {
    marginHorizontal: 20,
    marginBottom: 8,
    backgroundColor: '#FF4444',
    borderRadius: 30,
    paddingVertical: 4,
  },
  submitButtonLabel: {
    fontWeight: 'bold',
  },
  cancelButton: {
    marginHorizontal: 20,
    marginBottom: 40,
  },

  // Confirm / Success
  confirmContainer: {
    alignItems: 'center',
    padding: 32,
    gap: 12,
  },
  confirmIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  confirmDesc: {
    fontSize: 14,
    color: '#A0A0A0',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 10,
  },
  blockButton: {
    marginTop: 16,
    width: '100%',
    backgroundColor: '#FF4444',
    borderRadius: 30,
    paddingVertical: 4,
  },
  blockButtonLabel: {
    fontWeight: 'bold',
  },
  doneButton: {
    marginTop: 16,
    width: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 30,
    paddingVertical: 4,
  },
  doneButtonLabel: {
    fontWeight: 'bold',
  },
});
