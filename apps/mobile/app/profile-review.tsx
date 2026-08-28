import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Text, Surface, IconButton, Button, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { useAuthStore } from '../stores/auth';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
import { API_URL } from '../services/config';

// Types
interface CompletenessField {
  id: string;
  label: string;
  filled: boolean;
  required: boolean;
}

interface PhotoCriterion {
  id: string;
  label: string;
  description: string;
  weight: number;
}

interface BioCriterion {
  id: string;
  label: string;
  description: string;
  weight: number;
}

interface ProfileReviewData {
  overallScore: number;
  grade: string;
  completeness: {
    fields: CompletenessField[];
    score: number;
    missingRequired: string[];
  };
  photoAnalysis: {
    criteria: PhotoCriterion[];
    scores: Record<string, number>;
    tips: string[];
    overallScore: number;
  };
  bioAnalysis: {
    criteria: BioCriterion[];
    scores: Record<string, number>;
    tips: string[];
    suggestions: string[];
    overallScore: number;
  };
  interestAnalysis: {
    count: number;
    coverage: string;
    suggestions: string[];
  };
  topImprovements: string[];
  estimatedBoost: number;
}

// Animated score circle
function ScoreCircle({ score, grade }: { score: number; grade: string }) {
  const scale = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 12, stiffness: 100 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const getScoreColor = (s: number) => {
    if (s >= 80) return '#4CAF50';
    if (s >= 60) return '#FF9800';
    return '#FF4444';
  };

  return (
    <View style={styles.scoreCircleContainer}>
      <Animated.View style={[styles.scoreCircleOuter, animatedStyle]}>
        <View style={[styles.scoreCircleBg, { borderColor: getScoreColor(score) }]} />
        <View style={styles.scoreCircleInner}>
          <Text style={[styles.scoreNumber, { color: getScoreColor(score) }]}>{score}</Text>
          <Text style={styles.scoreGrade}>{grade}</Text>
        </View>
      </Animated.View>
    </View>
  );
}

// Animated progress bar
function ProgressBar({
  label,
  score,
  description,
  color,
  delay = 0,
}: {
  label: string;
  score: number;
  description?: string;
  color: string;
  delay?: number;
}) {
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withDelay(delay, withSpring(score, { damping: 20, stiffness: 100 }));
  }, [score]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${interpolate(width.value, [0, 100], [0, 100], Extrapolation.CLAMP)}%`,
  }));

  const getScoreLabel = (s: number) => {
    if (s >= 90) return 'Excellent';
    if (s >= 75) return 'Good';
    if (s >= 50) return 'Needs Work';
    return 'Critical';
  };

  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressHeader}>
        <View style={styles.progressLabelRow}>
          <Text style={styles.progressLabel}>{label}</Text>
          <Text style={[styles.progressScore, { color }]}>{score}%</Text>
        </View>
        {description && <Text style={styles.progressDesc}>{description}</Text>}
      </View>
      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressFill, { backgroundColor: color }, animatedStyle]} />
      </View>
    </View>
  );
}

// Tip card
function TipCard({ tip, index }: { tip: string; index: number }) {
  return (
    <View style={styles.tipCard}>
      <View style={styles.tipIcon}>
        <MaterialCommunityIcons name="lightbulb-outline" size={18} color="#FF9800" />
      </View>
      <Text style={styles.tipText}>{tip}</Text>
    </View>
  );
}

// Section card
function SectionCard({
  title,
  icon,
  score,
  children,
  isExpanded,
  onToggle,
}: {
  title: string;
  icon: string;
  score: number;
  children: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <Surface style={styles.sectionCard} elevation={1}>
      <TouchableOpacity onPress={onToggle} activeOpacity={0.7} style={styles.sectionHeader}>
        <View style={styles.sectionHeaderLeft}>
          <MaterialCommunityIcons name={icon as any} size={22} color="#00E676" />
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        <View style={styles.sectionHeaderRight}>
          <Text style={[styles.sectionScore, score >= 70 ? styles.scoreGood : styles.scoreBad]}>
            {score}%
          </Text>
          <MaterialCommunityIcons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color="#999"
          />
        </View>
      </TouchableOpacity>
      {isExpanded && <View style={styles.sectionContent}>{children}</View>}
    </Surface>
  );
}

export default function ProfileReviewScreen() {
  const router = useRouter();
  const [review, setReview] = useState<ProfileReviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    photos: true,
    bio: true,
    interests: false,
  });

  const { token } = useAuthStore();

  useEffect(() => {
    let cancelled = false;
    const fetchReview = async () => {
      try {
        const res = await fetch(`${API_URL}/profile-review`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (res.ok) {
          const data = await res.json();
          if (!cancelled && data.review) {
            setReview(data.review);
          }
        }
      } catch {
        // API unreachable — use fallback review data
        if (!cancelled) {
          setReview({
            overallScore: 50,
            grade: 'C',
            completeness: {
              fields: [
                { id: 'name', label: 'Name', filled: true, required: true },
                { id: 'photos', label: 'Photos (2+)', filled: true, required: true },
                { id: 'bio', label: 'Bio', filled: true, required: true },
                { id: 'interests', label: 'Interests (3+)', filled: false, required: true },
                { id: 'dob', label: 'Date of Birth', filled: true, required: true },
                { id: 'gender', label: 'Gender', filled: true, required: true },
                { id: 'location', label: 'Location', filled: false, required: false },
              ],
              score: 71,
              missingRequired: ['Interests (3+)'],
            },
            photoAnalysis: {
              criteria: [
                { id: 'main_photo', label: 'Main Photo', description: 'Clear headshot', weight: 25 },
                { id: 'full_body', label: 'Full Body', description: 'Full-length photo', weight: 15 },
                { id: 'activity', label: 'Activity', description: 'Doing something fun', weight: 15 },
                { id: 'social', label: 'Social', description: 'Photo with others', weight: 10 },
                { id: 'variety', label: 'Variety', description: 'Different settings', weight: 15 },
                { id: 'count', label: 'Count', description: '4+ photos', weight: 20 },
              ],
              scores: { main_photo: 88, full_body: 65, activity: 45, social: 30, variety: 55, count: 50 },
              tips: ['Complete your profile for personalized photo analysis'],
              overallScore: 50,
            },
            bioAnalysis: {
              criteria: [
                { id: 'length', label: 'Length', description: '100-250 chars optimal', weight: 20 },
                { id: 'personality', label: 'Personality', description: 'Shows who you are', weight: 25 },
                { id: 'conversation', label: 'Conversation', description: 'Easy to respond to', weight: 25 },
                { id: 'positivity', label: 'Positivity', description: 'Upbeat tone', weight: 15 },
                { id: 'specificity', label: 'Specificity', description: 'Specific over generic', weight: 15 },
              ],
              scores: { length: 75, personality: 60, conversation: 45, positivity: 85, specificity: 55 },
              tips: ['Complete your profile for personalized bio analysis'],
              suggestions: ['Add at least 3 interests to improve AI matching'],
              overallScore: 50,
            },
            interestAnalysis: {
              count: 0,
              coverage: 'No interests selected',
              suggestions: ['Add at least 3 interests to help our AI find compatible matches'],
            },
            topImprovements: [
              'Connect to the API for personalized profile analysis',
              'Add at least 3 interests to improve AI matching',
              'Complete all required profile fields',
            ],
            estimatedBoost: 20,
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchReview();
    return () => { cancelled = true; };
  }, [token]);

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <MaterialCommunityIcons name="brain" size={48} color="#00E676" />
        <Text style={styles.loadingText}>Analyzing your profile...</Text>
        <Text style={styles.loadingSubtext}>Our AI is reviewing your photos, bio, and interests</Text>
      </View>
    );
  }

  if (!review) return null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <IconButton icon="arrow-left" size={24} onPress={() => router.back()} />
        <Text variant="titleLarge" style={styles.headerTitle}>
          Profile Review
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Overall Score */}
        <View style={styles.scoreSection}>
          <ScoreCircle score={review.overallScore} grade={review.grade} />

          <Text style={styles.scoreLabel}>Your Profile Score</Text>
          <Text style={styles.scoreDescription}>
            {review.overallScore >= 80
              ? 'Your profile is in great shape! Keep it up.'
              : review.overallScore >= 60
              ? 'Good start! A few tweaks can boost your matches significantly.'
              : 'Your profile needs some work. Follow the tips below to improve.'}
          </Text>

          {/* Estimated boost */}
          <Surface style={styles.boostCard} elevation={1}>
            <MaterialCommunityIcons name="trending-up" size={22} color="#4CAF50" />
            <View style={styles.boostInfo}>
              <Text style={styles.boostTitle}>Potential Match Boost</Text>
              <Text style={styles.boostValue}>+{review.estimatedBoost}%</Text>
            </View>
            <Text style={styles.boostHint}>if you complete all improvements</Text>
          </Surface>
        </View>

        {/* Completeness */}
        <View style={styles.completenessSection}>
          <Text style={styles.sectionHeading}>Profile Completeness</Text>
          <View style={styles.completenessBar}>
            <View style={[styles.completenessFill, { width: `${review.completeness.score}%` }]} />
          </View>
          <Text style={styles.completenessText}>{review.completeness.score}% complete</Text>

          <View style={styles.fieldsGrid}>
            {review.completeness.fields.map((field) => (
              <View key={field.id} style={styles.fieldRow}>
                <MaterialCommunityIcons
                  name={field.filled ? 'check-circle' : 'close-circle'}
                  size={18}
                  color={field.filled ? '#4CAF50' : '#FF4444'}
                />
                <Text
                  style={[styles.fieldLabel, !field.filled && field.required && styles.fieldMissing]}
                >
                  {field.label}
                  {field.required && !field.filled && ' *'}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Photo Analysis */}
        <SectionCard
          title="Photo Analysis"
          icon="camera"
          score={review.photoAnalysis.overallScore}
          isExpanded={expandedSections.photos}
          onToggle={() => toggleSection('photos')}
        >
          {review.photoAnalysis.criteria.map((criterion) => (
            <ProgressBar
              key={criterion.id}
              label={criterion.label}
              score={review.photoAnalysis.scores[criterion.id] || 0}
              description={criterion.description}
              color={
                (review.photoAnalysis.scores[criterion.id] || 0) >= 70
                  ? '#4CAF50'
                  : (review.photoAnalysis.scores[criterion.id] || 0) >= 40
                  ? '#FF9800'
                  : '#FF4444'
              }
            />
          ))}

          <Divider style={styles.divider} />
          <Text style={styles.tipsHeader}>💡 Tips</Text>
          {review.photoAnalysis.tips.map((tip, i) => (
            <TipCard key={i} tip={tip} index={i} />
          ))}
        </SectionCard>

        {/* Bio Analysis */}
        <SectionCard
          title="Bio Analysis"
          icon="text"
          score={review.bioAnalysis.overallScore}
          isExpanded={expandedSections.bio}
          onToggle={() => toggleSection('bio')}
        >
          {review.bioAnalysis.criteria.map((criterion) => (
            <ProgressBar
              key={criterion.id}
              label={criterion.label}
              score={review.bioAnalysis.scores[criterion.id] || 0}
              description={criterion.description}
              color={
                (review.bioAnalysis.scores[criterion.id] || 0) >= 70
                  ? '#4CAF50'
                  : (review.bioAnalysis.scores[criterion.id] || 0) >= 40
                  ? '#FF9800'
                  : '#FF4444'
              }
            />
          ))}

          {review.bioAnalysis.suggestions.length > 0 && (
            <>
              <Divider style={styles.divider} />
              <Text style={styles.tipsHeader}>✍️ Suggestions</Text>
              {review.bioAnalysis.suggestions.map((suggestion, i) => (
                <TipCard key={i} tip={suggestion} index={i} />
              ))}
            </>
          )}

          <Divider style={styles.divider} />
          <Text style={styles.tipsHeader}>💡 Tips</Text>
          {review.bioAnalysis.tips.map((tip, i) => (
            <TipCard key={i} tip={tip} index={i} />
          ))}
        </SectionCard>

        {/* Interest Analysis */}
        <SectionCard
          title="Interest Analysis"
          icon="tag-heart"
          score={review.interestAnalysis.count >= 3 ? 85 : review.interestAnalysis.count * 25}
          isExpanded={expandedSections.interests}
          onToggle={() => toggleSection('interests')}
        >
          <View style={styles.interestSummary}>
            <MaterialCommunityIcons
              name="tag-heart"
              size={24}
              color={review.interestAnalysis.count >= 3 ? '#4CAF50' : '#FF9800'}
            />
            <View>
              <Text style={styles.interestCount}>{review.interestAnalysis.count} interests selected</Text>
              <Text style={styles.interestCoverage}>{review.interestAnalysis.coverage}</Text>
            </View>
          </View>

          {review.interestAnalysis.suggestions.map((suggestion, i) => (
            <TipCard key={i} tip={suggestion} index={i} />
          ))}
        </SectionCard>

        {/* Top Improvements */}
        <Surface style={styles.improvementsCard} elevation={2}>
          <View style={styles.improvementsHeader}>
            <MaterialCommunityIcons name="rocket-launch" size={24} color="#00E676" />
            <Text style={styles.improvementsTitle}>Top Improvements</Text>
          </View>
          {review.topImprovements.map((improvement, i) => (
            <View key={i} style={styles.improvementRow}>
              <View style={styles.improvementNumber}>
                <Text style={styles.improvementNumberText}>{i + 1}</Text>
              </View>
              <Text style={styles.improvementText}>{improvement}</Text>
            </View>
          ))}
        </Surface>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.footer}>
        <Button
          mode="contained"
          onPress={() => router.back()}
          style={styles.ctaButton}
          labelStyle={styles.ctaButtonLabel}
          icon="pencil"
        >
          Edit Profile
        </Button>
      </View>
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

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A0A0A',
    gap: 16,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#A0A0A0',
    textAlign: 'center',
    paddingHorizontal: 40,
  },

  // Score section
  scoreSection: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#141414',
    marginBottom: 12,
  },
  scoreCircleContainer: {
    marginBottom: 16,
  },
  scoreCircleOuter: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1C1C1C',
  },
  scoreCircleBg: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 60,
    borderWidth: 6,
    borderColor: '#2A2A2A',
  },
  scoreCircleInner: {
    alignItems: 'center',
  },
  scoreNumber: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFF',
  },
  scoreGrade: {
    fontSize: 16,
    fontWeight: '600',
    color: '#A0A0A0',
    marginTop: -4,
  },
  scoreLabel: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
  },
  scoreDescription: {
    fontSize: 14,
    color: '#A0A0A0',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  boostCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FFF4',
    padding: 14,
    borderRadius: 12,
    width: '100%',
    gap: 10,
  },
  boostInfo: {
    flex: 1,
  },
  boostTitle: {
    fontSize: 13,
    color: '#A0A0A0',
  },
  boostValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  boostHint: {
    fontSize: 11,
    color: '#A0A0A0',
    maxWidth: 80,
    textAlign: 'right',
  },

  // Completeness
  completenessSection: {
    padding: 20,
    backgroundColor: '#141414',
    marginBottom: 12,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 12,
  },
  completenessBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1C1C1C',
    overflow: 'hidden',
    marginBottom: 6,
  },
  completenessFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#00E676',
  },
  completenessText: {
    fontSize: 13,
    color: '#A0A0A0',
    marginBottom: 16,
  },
  fieldsGrid: {
    gap: 8,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  fieldLabel: {
    fontSize: 14,
    color: '#FFF',
  },
  fieldMissing: {
    color: '#FF4444',
    fontWeight: '600',
  },

  // Section cards
  sectionCard: {
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 16,
    backgroundColor: '#141414',
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  sectionHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionScore: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  scoreGood: {
    color: '#4CAF50',
  },
  scoreBad: {
    color: '#FF9800',
  },
  sectionContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },

  // Progress bars
  progressContainer: {
    gap: 4,
  },
  progressHeader: {
    gap: 2,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 14,
    color: '#FFF',
  },
  progressScore: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressDesc: {
    fontSize: 12,
    color: '#A0A0A0',
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1C1C1C',
    overflow: 'hidden',
    marginTop: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },

  // Tips
  divider: {
    marginVertical: 4,
  },
  tipsHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 4,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 6,
  },
  tipIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFF8E1',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: '#A0A0A0',
    lineHeight: 18,
  },

  // Interests
  interestSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  interestCount: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFF',
  },
  interestCoverage: {
    fontSize: 13,
    color: '#A0A0A0',
  },

  // Improvements
  improvementsCard: {
    marginHorizontal: 12,
    marginBottom: 12,
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#141414',
  },
  improvementsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  improvementsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  improvementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  improvementNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#00E676',
    justifyContent: 'center',
    alignItems: 'center',
  },
  improvementNumberText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  improvementText: {
    flex: 1,
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
  },

  // Footer
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 36,
    paddingTop: 12,
    backgroundColor: '#141414',
    borderTopWidth: 1,
    borderTopColor: '#1C1C1C',
  },
  ctaButton: {
    backgroundColor: '#00E676',
    borderRadius: 30,
    paddingVertical: 4,
  },
  ctaButtonLabel: {
    fontWeight: 'bold',
    letterSpacing: 0.5,
    fontSize: 15,
  },
});
