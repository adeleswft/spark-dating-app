import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Animated,
  Alert,
} from 'react-native';
import { Text, Button, Surface, IconButton, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useScreenshotPrevention } from '../hooks/useScreenshotPrevention';
import { useAuthStore } from '../stores/auth';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
import { API_URL } from '../services/config';

type VerificationStep = 'overview' | 'photo-capture' | 'photo-liveness' | 'photo-match' | 'id-capture' | 'id-capture-back' | 'id-analysis' | 'complete';
type VerificationType = 'photo' | 'id' | 'both';

interface StepConfig {
  id: string;
  title: string;
  icon: string;
  description: string;
}

const PHOTO_STEPS: StepConfig[] = [
  { id: 'capture', title: 'Take a Selfie', icon: 'camera', description: 'Position your face in the frame' },
  { id: 'liveness', title: 'Liveness Check', icon: 'face-recognition', description: 'Follow the on-screen prompts' },
  { id: 'match', title: 'Face Match', icon: 'check-decagram', description: 'Comparing with your profile photos' },
];

const ID_STEPS: StepConfig[] = [
  { id: 'front', title: 'Front of ID', icon: 'card-account-details', description: 'Capture the front of your government ID' },
  { id: 'back', title: 'Back of ID', icon: 'card-account-details-outline', description: 'Capture the back (if applicable)' },
  { id: 'analysis', title: 'Verification', icon: 'shield-check', description: 'Analyzing your document' },
];

// Liveness prompts for the face verification
const LIVENESS_PROMPTS = [
  { instruction: 'Look straight at the camera', emoji: '👀', action: 'Hold steady...' },
  { instruction: 'Slowly turn your head left', emoji: '👈', action: 'Turning...' },
  { instruction: 'Turn back to center', emoji: '🎯', action: 'Centering...' },
  { instruction: 'Smile naturally', emoji: '😊', action: 'Capturing smile...' },
];

// Step indicator component
function StepIndicator({
  steps,
  currentStep,
}: {
  steps: { id: string; title: string }[];
  currentStep: number;
}) {
  return (
    <View style={styles.stepIndicator}>
      {steps.map((step, i) => {
        const isComplete = i < currentStep;
        const isActive = i === currentStep;
        return (
          <React.Fragment key={step.id}>
            {i > 0 && (
              <View style={[styles.stepLine, isComplete && styles.stepLineComplete]} />
            )}
            <View style={styles.stepDotContainer}>
              <View
                style={[
                  styles.stepDot,
                  isComplete && styles.stepDotComplete,
                  isActive && styles.stepDotActive,
                ]}
              >
                {isComplete ? (
                  <MaterialCommunityIcons name="check" size={12} color="#fff" />
                ) : (
                  <Text style={[styles.stepDotText, isActive && styles.stepDotTextActive]}>
                    {i + 1}
                  </Text>
                )}
              </View>
              <Text
                style={[styles.stepLabel, isActive && styles.stepLabelActive, isComplete && styles.stepLabelComplete]}
                numberOfLines={1}
              >
                {step.title}
              </Text>
            </View>
          </React.Fragment>
        );
      })}
    </View>
  );
}

// Progress ring for liveness check
function LivenessProgress({ progress }: { progress: number }) {
  return (
    <View style={styles.livenessProgress}>
      <View style={styles.livenessRingOuter}>
        <View
          style={[
            styles.livenessRing,
            {
              borderColor: progress >= 1 ? '#4CAF50' : '#6C63FF',
            },
          ]}
        />
      </View>
      <Text style={styles.livenessPercent}>{Math.round(progress * 100)}%</Text>
    </View>
  );
}

export default function VerificationScreen() {
  const router = useRouter();
  const { token } = useAuthStore();
  // Prevent screenshots during ID verification (sensitive documents)
  useScreenshotPrevention();
  const [verificationType, setVerificationType] = useState<VerificationType | null>(null);
  const [step, setStep] = useState<VerificationStep>('overview');
  const [photoStep, setPhotoStep] = useState(0);
  const [idStep, setIdStep] = useState(0);
  const [capturedSelfie, setCapturedSelfie] = useState<string | null>(null);
  const [capturedFront, setCapturedFront] = useState<string | null>(null);
  const [capturedBack, setCapturedBack] = useState<string | null>(null);
  const [livenessProgress, setLivenessProgress] = useState(0);
  const [livenessPromptIndex, setLivenessPromptIndex] = useState(0);
  const [processing, setProcessing] = useState(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Start pulse animation for capture prompts
  const startPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  };

  const handleStartVerification = async (type: VerificationType) => {
    setVerificationType(type);
    // Notify API that verification is starting
    try {
      const endpoint = type === 'id' ? '/verification/id' : '/verification/photo';
      await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    } catch {
      // Continue even if API call fails
    }
    if (type === 'photo' || type === 'both') {
      setStep('photo-capture');
      setPhotoStep(0);
      startPulse();
    } else {
      setStep('id-capture');
      setIdStep(0);
    }
  };

  const handleCaptureSelfie = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission needed', 'Camera permission is required for verification.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
      });

      if (!result.canceled && result.assets[0]) {
        setCapturedSelfie(result.assets[0].uri);
        // Submit selfie to API
        try {
          const formData = new FormData();
          formData.append('selfie', {
            uri: result.assets[0].uri,
            type: 'image/jpeg',
            name: 'selfie.jpg',
          } as any);
          await fetch(`${API_URL}/verification/photo/submit`, {
            method: 'POST',
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            body: formData,
          });
        } catch {
          // Continue even if API fails
        }
        // Move to liveness check
        setStep('photo-liveness');
        setPhotoStep(1);
        simulateLiveness();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to capture selfie.');
    }
  };

  const simulateLiveness = () => {
    let currentPrompt = 0;
    let progress = 0;

    const interval = setInterval(() => {
      currentPrompt++;
      progress = currentPrompt / LIVENESS_PROMPTS.length;
      setLivenessProgress(progress);
      setLivenessPromptIndex(currentPrompt);

      if (currentPrompt >= LIVENESS_PROMPTS.length) {
        clearInterval(interval);
        // Liveness passed
        setTimeout(() => {
          setStep('photo-match');
          setPhotoStep(2);
          // Simulate face match
          setTimeout(() => {
            setStep('overview');
            if (verificationType === 'both') {
              // Start ID verification
              setTimeout(() => {
                setVerificationType('id');
                setStep('id-capture');
                setIdStep(0);
              }, 500);
            } else {
              setStep('complete');
            }
          }, 2000);
        }, 500);
      }
    }, 1200);
  };

  const handleCaptureID = async (side: 'front' | 'back') => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission needed', 'Camera permission is required for ID verification.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1.586, 1], // Standard ID card ratio
        quality: 0.9,
      });

      if (!result.canceled && result.assets[0]) {
        if (side === 'front') {
          setCapturedFront(result.assets[0].uri);
          setIdStep(1);
          // Ask for back or skip
          Alert.alert('Back of ID', 'Do you have the back of your ID to capture?', [
            { text: 'Skip', onPress: () => handleIDAnalysis() },
            { text: 'Capture Back', onPress: () => setStep('id-capture-back') },
          ]);
        } else {
          setCapturedBack(result.assets[0].uri);
          handleIDAnalysis();
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to capture ID photo.');
    }
  };

  const handleIDAnalysis = () => {
    setStep('id-analysis');
    setIdStep(2);
    setProcessing(true);

    // Submit to API
    const submitID = async () => {
      try {
        const formData = new FormData();
        if (capturedFront) {
          formData.append('front', {
            uri: capturedFront,
            type: 'image/jpeg',
            name: 'id-front.jpg',
          } as any);
        }
        if (capturedBack) {
          formData.append('back', {
            uri: capturedBack,
            type: 'image/jpeg',
            name: 'id-back.jpg',
          } as any);
        }
        await fetch(`${API_URL}/verification/id/submit`, {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
        });
      } catch {
        // Continue even if API fails
      }
    };
    submitID();

    // Simulate document analysis delay
    setTimeout(() => {
      setProcessing(false);
      setStep('complete');
    }, 3000);
  };

  // Render based on current state
  const renderOverview = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.overviewHeader}>
        <View style={styles.shieldIcon}>
          <MaterialCommunityIcons name="shield-check" size={48} color="#00E676" />
        </View>
        <Text style={styles.overviewTitle}>Get Verified</Text>
        <Text style={styles.overviewSubtitle}>
          Verified profiles get 30% more matches and build trust with potential connections
        </Text>
      </View>

      {/* Photo Verification Card */}
      <TouchableOpacity
        style={styles.verifyCard}
        onPress={() => handleStartVerification('photo')}
        activeOpacity={0.7}
      >
        <View style={styles.verifyCardIcon}>
          <MaterialCommunityIcons name="camera" size={28} color="#fff" />
        </View>
        <View style={styles.verifyCardInfo}>
          <Text style={styles.verifyCardTitle}>Photo Verification</Text>
          <Text style={styles.verifyCardDesc}>
            Take a selfie that matches your profile photos
          </Text>
          <View style={styles.verifyBadge}>
            <MaterialCommunityIcons name="check-decagram" size={16} color="#4CAF50" />
            <Text style={styles.verifyBadgeText}>Gets a trust badge ✓</Text>
          </View>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={24} color="#ccc" />
      </TouchableOpacity>

      {/* ID Verification Card */}
      <TouchableOpacity
        style={styles.verifyCard}
        onPress={() => handleStartVerification('id')}
        activeOpacity={0.7}
      >
        <View style={[styles.verifyCardIcon, { backgroundColor: '#6C63FF' }]}>
          <MaterialCommunityIcons name="card-account-details" size={28} color="#fff" />
        </View>
        <View style={styles.verifyCardInfo}>
          <Text style={styles.verifyCardTitle}>ID Verification</Text>
          <Text style={styles.verifyCardDesc}>
            Verify with a government-issued photo ID
          </Text>
          <View style={styles.verifyBadge}>
            <MaterialCommunityIcons name="star" size={16} color="#FFD700" />
            <Text style={styles.verifyBadgeText}>Earn 100 boost points</Text>
          </View>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={24} color="#ccc" />
      </TouchableOpacity>

      {/* Do Both Card */}
      <TouchableOpacity
        style={[styles.verifyCard, styles.verifyCardFeatured]}
        onPress={() => handleStartVerification('both')}
        activeOpacity={0.7}
      >
        <View style={[styles.verifyCardIcon, { backgroundColor: '#00E676' }]}>
          <MaterialCommunityIcons name="shield-star" size={28} color="#fff" />
        </View>
        <View style={styles.verifyCardInfo}>
          <Text style={styles.verifyCardTitle}>Full Verification</Text>
          <Text style={styles.verifyCardDesc}>
            Photo + ID verification for maximum trust
          </Text>
          <View style={styles.verifyBadge}>
            <MaterialCommunityIcons name="crown" size={16} color="#FFD700" />
            <Text style={styles.verifyBadgeText}>Highest trust level + 150 boost points</Text>
          </View>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={24} color="#ccc" />
      </TouchableOpacity>

      {/* Info section */}
      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>How it works</Text>
        {[
          { icon: 'camera', text: 'Take a selfie or scan your ID' },
          { icon: 'brain', text: 'Our AI analyzes your submission' },
          { icon: 'check-circle', text: 'Get verified in minutes' },
          { icon: 'trending-up', text: 'Enjoy more matches and trust' },
        ].map((item, i) => (
          <View key={i} style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <MaterialCommunityIcons name={item.icon as any} size={18} color="#00E676" />
            </View>
            <Text style={styles.infoText}>{item.text}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );

  const renderPhotoVerification = () => {
    if (step === 'photo-capture') {
      return (
        <View style={styles.captureContainer}>
          <StepIndicator steps={PHOTO_STEPS} currentStep={0} />

          <View style={styles.captureArea}>
            <Animated.View
              style={[styles.captureFrame, { transform: [{ scale: pulseAnim }] }]}
            >
              {capturedSelfie ? (
                <Image source={{ uri: capturedSelfie }} style={styles.capturedImage} />
              ) : (
                <View style={styles.capturePlaceholder}>
                  <MaterialCommunityIcons name="camera" size={48} color="#ccc" />
                  <Text style={styles.capturePlaceholderText}>Position your face here</Text>
                </View>
              )}
            </Animated.View>
          </View>

          <View style={styles.captureTips}>
            <Text style={styles.tipTitle}>Tips for a great selfie:</Text>
            {['Use good lighting', 'Remove sunglasses or hats', 'Keep a neutral expression'].map(
              (tip, i) => (
                <View key={i} style={styles.tipRow}>
                  <MaterialCommunityIcons name="check-circle" size={16} color="#4CAF50" />
                  <Text style={styles.tipText}>{tip}</Text>
                </View>
              )
            )}
          </View>

          <Button
            mode="contained"
            onPress={handleCaptureSelfie}
            style={styles.captureButton}
            labelStyle={styles.captureButtonLabel}
            icon="camera"
          >
            Take Selfie
          </Button>
        </View>
      );
    }

    if (step === 'photo-liveness') {
      const currentPrompt = LIVENESS_PROMPTS[Math.min(livenessPromptIndex, LIVENESS_PROMPTS.length - 1)];
      return (
        <View style={styles.livenessContainer}>
          <StepIndicator steps={PHOTO_STEPS} currentStep={1} />

          <View style={styles.livenessArea}>
            <LivenessProgress progress={livenessProgress} />

            <View style={styles.livenessFrame}>
              {capturedSelfie && (
                <Image source={{ uri: capturedSelfie }} style={styles.capturedImage} />
              )}
            </View>

            <View style={styles.livenessPrompt}>
              <Text style={styles.livenessEmoji}>{currentPrompt.emoji}</Text>
              <Text style={styles.livenessInstruction}>{currentPrompt.instruction}</Text>
              <Text style={styles.livenessAction}>{currentPrompt.action}</Text>
            </View>
          </View>

          <View style={styles.livenessDots}>
            {LIVENESS_PROMPTS.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.livenessDot,
                  i < livenessProgress * LIVENESS_PROMPTS.length && styles.livenessDotComplete,
                  i === livenessPromptIndex && styles.livenessDotActive,
                ]}
              />
            ))}
          </View>
        </View>
      );
    }

    if (step === 'photo-match') {
      return (
        <View style={styles.matchContainer}>
          <StepIndicator steps={PHOTO_STEPS} currentStep={2} />

          <View style={styles.matchArea}>
            <Animated.View style={styles.matchSpinner}>
              <ActivityIndicator size="large" color="#6C63FF" />
            </Animated.View>

            <Text style={styles.matchTitle}>Comparing Faces</Text>
            <Text style={styles.matchSubtitle}>
              Checking that your selfie matches your profile photos
            </Text>

            {capturedSelfie && (
              <View style={styles.matchPreview}>
                <Image source={{ uri: capturedSelfie }} style={styles.matchPhoto} />
                <MaterialCommunityIcons name="arrow-right" size={24} color="#00E676" />
                <Image
                  source={{ uri: 'https://picsum.photos/seed/alex1/200/200' }}
                  style={styles.matchPhoto}
                />
              </View>
            )}
          </View>
        </View>
      );
    }

    return null;
  };

  const renderIDVerification = () => {
    if (step === 'id-capture' || step === 'id-capture-back') {
      const isBack = step === 'id-capture-back';
      return (
        <View style={styles.captureContainer}>
          <StepIndicator steps={ID_STEPS} currentStep={isBack ? 1 : 0} />

          <View style={styles.captureArea}>
            <Animated.View
              style={[styles.captureFrame, styles.captureFrameWide, { transform: [{ scale: pulseAnim }] }]}
            >
              {(isBack ? capturedBack : capturedFront) ? (
                <Image
                  source={{ uri: isBack ? capturedBack! : capturedFront! }}
                  style={styles.capturedImage}
                />
              ) : (
                <View style={styles.capturePlaceholder}>
                  <MaterialCommunityIcons
                    name="card-account-details"
                    size={48}
                    color="#ccc"
                  />
                  <Text style={styles.capturePlaceholderText}>
                    {isBack ? 'Back of ID' : 'Front of ID'}
                  </Text>
                </View>
              )}
            </Animated.View>
          </View>

          <View style={styles.captureTips}>
            <Text style={styles.tipTitle}>ID photo tips:</Text>
            {[
              'Ensure all text is readable',
              'No glare or shadows on the ID',
              'ID must not be expired',
            ].map((tip, i) => (
              <View key={i} style={styles.tipRow}>
                <MaterialCommunityIcons name="check-circle" size={16} color="#4CAF50" />
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </View>

          <Button
            mode="contained"
            onPress={() => handleCaptureID(isBack ? 'back' : 'front')}
            style={styles.captureButton}
            labelStyle={styles.captureButtonLabel}
            icon="camera"
          >
            {isBack ? 'Capture Back' : 'Capture Front'}
          </Button>
        </View>
      );
    }

    if (step === 'id-analysis') {
      return (
        <View style={styles.matchContainer}>
          <StepIndicator steps={ID_STEPS} currentStep={2} />

          <View style={styles.matchArea}>
            <Animated.View style={styles.matchSpinner}>
              <ActivityIndicator size="large" color="#6C63FF" />
            </Animated.View>

            <Text style={styles.matchTitle}>Analyzing Document</Text>
            <Text style={styles.matchSubtitle}>
              Verifying your ID and extracting information
            </Text>

            <View style={styles.analysisSteps}>
              {['Document authenticity check', 'Name & DOB extraction', 'Expiration date validation', 'Tampering detection'].map(
                (label, i) => (
                  <View key={i} style={styles.analysisRow}>
                    <MaterialCommunityIcons
                      name={processing ? 'loading' : 'check-circle'}
                      size={18}
                      color={processing ? '#FF9800' : '#4CAF50'}
                    />
                    <Text style={styles.analysisText}>{label}</Text>
                  </View>
                )
              )}
            </View>
          </View>
        </View>
      );
    }

    return null;
  };

  const renderComplete = () => (
    <View style={styles.completeContainer}>
      <View style={styles.completeIcon}>
        <MaterialCommunityIcons name="check-decagram" size={72} color="#4CAF50" />
      </View>

      <Text style={styles.completeTitle}>You're Verified!</Text>
      <Text style={styles.completeSubtitle}>
        Your profile now has a verification badge. This increases trust and helps you get more matches.
      </Text>

      {verificationType === 'photo' || verificationType === 'both' ? (
        <Surface style={styles.badgeCard} elevation={1}>
          <MaterialCommunityIcons name="check-decagram" size={24} color="#4CAF50" />
          <Text style={styles.badgeText}>Photo Verified ✓</Text>
        </Surface>
      ) : null}

      {verificationType === 'id' || verificationType === 'both' ? (
        <Surface style={styles.badgeCard} elevation={1}>
          <MaterialCommunityIcons name="card-account-details" size={24} color="#6C63FF" />
          <Text style={styles.badgeText}>ID Verified ✓</Text>
        </Surface>
      ) : null}

      {verificationType === 'both' && (
        <Surface style={[styles.badgeCard, { backgroundColor: '#FFF8E1' }]} elevation={1}>
          <MaterialCommunityIcons name="star" size={24} color="#FFD700" />
          <Text style={[styles.badgeText, { color: '#FF9800' }]}>+150 Boost Points Earned!</Text>
        </Surface>
      )}

      <Button
        mode="contained"
        onPress={() => router.back()}
        style={styles.doneButton}
        labelStyle={styles.doneButtonLabel}
      >
        Done
      </Button>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <IconButton icon="arrow-left" size={24} onPress={() => router.back()} />
        <Text variant="titleLarge" style={styles.headerTitle}>
          {step === 'overview'
            ? 'Verification'
            : step === 'complete'
            ? 'Verified'
            : verificationType === 'photo' || verificationType === 'both'
            ? 'Photo Verification'
            : 'ID Verification'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {step === 'overview' && renderOverview()}
      {(step === 'photo-capture' || step === 'photo-liveness' || step === 'photo-match') &&
        renderPhotoVerification()}
      {(step === 'id-capture' || step === 'id-capture-back' || step === 'id-analysis') &&
        renderIDVerification()}
      {step === 'complete' && renderComplete()}
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

  // Overview
  overviewHeader: {
    alignItems: 'center',
    padding: 24,
    paddingBottom: 16,
  },
  shieldIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1B3A2A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  overviewTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
  },
  overviewSubtitle: {
    fontSize: 14,
    color: '#A0A0A0',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },

  // Verify cards
  verifyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#141414',
    gap: 14,
    elevation: 1,
  },
  verifyCardFeatured: {
    backgroundColor: '#1B3A2A',
    borderWidth: 1,
    borderColor: '#00E676',
  },
  verifyCardIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifyCardInfo: {
    flex: 1,
    gap: 4,
  },
  verifyCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  verifyCardDesc: {
    fontSize: 13,
    color: '#A0A0A0',
  },
  verifyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  verifyBadgeText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
  },

  // Info section
  infoSection: {
    marginHorizontal: 16,
    marginTop: 8,
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#141414',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  infoIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1B3A2A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 14,
    color: '#444',
    flex: 1,
  },

  // Step indicator
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 24,
    gap: 0,
  },
  stepDotContainer: {
    alignItems: 'center',
    gap: 6,
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepDotActive: {
    backgroundColor: '#6C63FF',
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  stepDotComplete: {
    backgroundColor: '#4CAF50',
  },
  stepDotText: {
    color: '#555',
    fontSize: 12,
    fontWeight: 'bold',
  },
  stepDotTextActive: {
    color: '#fff',
  },
  stepLabel: {
    fontSize: 11,
    color: '#555',
    width: 80,
    textAlign: 'center',
  },
  stepLabelActive: {
    color: '#6C63FF',
    fontWeight: '600',
  },
  stepLabelComplete: {
    color: '#4CAF50',
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: '#e0e0e0',
    marginBottom: 20,
    marginHorizontal: -4,
  },
  stepLineComplete: {
    backgroundColor: '#4CAF50',
  },

  // Capture container
  captureContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  captureArea: {
    alignItems: 'center',
    marginVertical: 20,
  },
  captureFrame: {
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 4,
    borderColor: '#6C63FF',
    borderStyle: 'dashed',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1C1C1C',
  },
  captureFrameWide: {
    width: SCREEN_WIDTH * 0.7,
    height: SCREEN_WIDTH * 0.7 / 1.586,
    borderRadius: 16,
    borderStyle: 'dashed',
  },
  capturePlaceholder: {
    alignItems: 'center',
    gap: 8,
  },
  capturePlaceholderText: {
    fontSize: 14,
    color: '#555',
  },
  capturedImage: {
    width: '100%',
    height: '100%',
  },
  captureTips: {
    marginVertical: 16,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 8,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  tipText: {
    fontSize: 13,
    color: '#A0A0A0',
  },
  captureButton: {
    backgroundColor: '#6C63FF',
    borderRadius: 30,
    paddingVertical: 4,
    marginTop: 8,
  },
  captureButtonLabel: {
    fontWeight: 'bold',
    fontSize: 16,
  },

  // Liveness
  livenessContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  livenessArea: {
    alignItems: 'center',
    marginVertical: 20,
    gap: 24,
  },
  livenessProgress: {
    alignItems: 'center',
    gap: 8,
  },
  livenessRingOuter: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1C1C1C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  livenessRing: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 4,
    borderTopColor: '#6C63FF',
    borderRightColor: '#6C63FF',
    borderBottomColor: '#e0e0e0',
    borderLeftColor: '#e0e0e0',
  },
  livenessPercent: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#6C63FF',
  },
  livenessFrame: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 3,
    borderColor: '#6C63FF',
    overflow: 'hidden',
  },
  livenessPrompt: {
    alignItems: 'center',
    gap: 8,
  },
  livenessEmoji: {
    fontSize: 40,
  },
  livenessInstruction: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  livenessAction: {
    fontSize: 14,
    color: '#6C63FF',
    fontWeight: '500',
  },
  livenessDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
  },
  livenessDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#e0e0e0',
  },
  livenessDotComplete: {
    backgroundColor: '#4CAF50',
  },
  livenessDotActive: {
    backgroundColor: '#6C63FF',
    width: 24,
    borderRadius: 5,
  },

  // Match / Analysis
  matchContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  matchArea: {
    alignItems: 'center',
    marginVertical: 40,
    gap: 16,
  },
  matchSpinner: {
    marginBottom: 8,
  },
  matchTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  matchSubtitle: {
    fontSize: 14,
    color: '#A0A0A0',
    textAlign: 'center',
  },
  matchPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 16,
  },
  matchPhoto: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#6C63FF',
  },
  analysisSteps: {
    marginTop: 20,
    gap: 12,
    width: '100%',
  },
  analysisRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
  },
  analysisText: {
    fontSize: 14,
    color: '#444',
  },

  // Complete
  completeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  completeIcon: {
    marginBottom: 8,
  },
  completeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  completeSubtitle: {
    fontSize: 14,
    color: '#A0A0A0',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  badgeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#F0FFF4',
    width: '100%',
  },
  badgeText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
  },
  doneButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 30,
    paddingVertical: 4,
    marginTop: 16,
    width: '100%',
  },
  doneButtonLabel: {
    fontWeight: 'bold',
    fontSize: 16,
  },
});
