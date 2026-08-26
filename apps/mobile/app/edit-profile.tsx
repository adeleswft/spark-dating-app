import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Dimensions,
  FlatList,
} from 'react-native';
import { Text, TextInput, Button, IconButton, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useOnboardingStore, ALL_INTERESTS, INTEREST_CATEGORY_MAP } from '../stores/onboarding';
import { useAuthStore } from '../stores/auth';
import { uploadPhotos, isLocalUri } from '../services/photoUpload';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PHOTO_GAP = 4;
const MAX_PHOTOS = 9;
const MAX_INTERESTS = 15;
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

type EditSection = 'overview' | 'photos' | 'bio' | 'interests';

export default function EditProfileScreen() {
  const router = useRouter();
  const { photos, name, bio, interests, addPhoto, removePhoto, setName, setBio, toggleInterest } = useOnboardingStore();
  const { token } = useAuthStore();
  const [section, setSection] = useState<EditSection>('overview');
  const [localName, setLocalName] = useState(name);
  const [localBio, setLocalBio] = useState(bio);
  const [interestSearch, setInterestSearch] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      // Upload any local photos first
      const localPhotos = photos.filter(isLocalUri);
      const remotePhotos = photos.filter((p) => !isLocalUri(p));
      let uploadedUrls: string[] = [];

      if (token && localPhotos.length > 0) {
        const results = await uploadPhotos(localPhotos, token);
        uploadedUrls = results.filter((r) => r.success).map((r) => r.url);
        const failedCount = results.filter((r) => !r.success).length;
        if (failedCount > 0) {
          Alert.alert('Warning', `${failedCount} photo(s) failed to upload and were skipped.`);
        }
      }

      const allPhotoUrls = [...remotePhotos, ...uploadedUrls];

      if (token) {
        const res = await fetch(`${API_URL}/onboarding`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: localName.trim(),
            bio: localBio.trim(),
            interests,
            photos: allPhotoUrls,
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || 'Failed to save');
        }
      }
      setName(localName.trim());
      setBio(localBio.trim());
      Alert.alert('Saved', 'Your profile has been updated!');
      router.back();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  }, [localName, localBio, setName, setBio, photos, interests, token, router]);

  const handleAddPhoto = async () => {
    if (photos.length >= MAX_PHOTOS) {
      Alert.alert('Maximum photos', `You can have up to ${MAX_PHOTOS} photos.`);
      return;
    }
    Alert.alert('Add Photo', 'Choose a source', [
      { text: 'Camera', onPress: () => pickImage(true) },
      { text: 'Gallery', onPress: () => pickImage(false) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const pickImage = async (useCamera: boolean) => {
    try {
      const permission = useCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission needed', 'Camera/Gallery permission is required.');
        return;
      }
      const result = useCamera
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [3, 4], quality: 0.8 })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [3, 4], quality: 0.8 });
      if (!result.canceled && result.assets[0]) {
        addPhoto(result.assets[0].uri);
      }
    } catch {
      Alert.alert('Error', 'Failed to pick image.');
    }
  };

  const handleRemovePhoto = (index: number) => {
    Alert.alert('Remove Photo', 'Remove this photo?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removePhoto(index) },
    ]);
  };

  const filteredInterests = interestSearch
    ? ALL_INTERESTS.filter((i) => i.toLowerCase().includes(interestSearch.toLowerCase()))
    : ALL_INTERESTS;

  // Overview section
  if (section === 'overview') {
    const thumbSize = (SCREEN_WIDTH - 64 - PHOTO_GAP * 2) / 3;
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <IconButton icon="arrow-left" size={24} onPress={() => router.back()} iconColor="#FFF" />
          <Text variant="titleLarge" style={styles.headerTitle}>Edit Profile</Text>
          <Button mode="text" onPress={handleSave} loading={saving} textColor="#00E676">Save</Button>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Photos */}
          <TouchableOpacity style={styles.sectionCard} onPress={() => setSection('photos')} activeOpacity={0.7}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="camera" size={20} color="#00E676" />
              <Text style={styles.sectionTitle}>Photos ({photos.length}/{MAX_PHOTOS})</Text>
              <MaterialCommunityIcons name="chevron-right" size={20} color="#555" />
            </View>
            <View style={styles.photoPreview}>
              {photos.slice(0, 3).map((uri, i) => (
                <View key={i} style={[styles.previewThumb, { width: thumbSize, height: thumbSize }]}>
                  <Image source={{ uri }} style={styles.previewThumbImage} />
                </View>
              ))}
              {photos.length === 0 && (
                <View style={[styles.previewThumb, styles.previewEmpty, { width: thumbSize, height: thumbSize }]}>
                  <MaterialCommunityIcons name="camera-plus" size={20} color="#555" />
                </View>
              )}
            </View>
          </TouchableOpacity>

          {/* Bio */}
          <TouchableOpacity style={styles.sectionCard} onPress={() => setSection('bio')} activeOpacity={0.7}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="text" size={20} color="#00E676" />
              <Text style={styles.sectionTitle}>About You</Text>
              <MaterialCommunityIcons name="chevron-right" size={20} color="#555" />
            </View>
            <View style={styles.bioPreview}>
              <Text style={styles.bioName}>{name || 'Your name'}</Text>
              <Text style={styles.bioText} numberOfLines={2}>{bio || 'Add a bio to tell people about yourself...'}</Text>
            </View>
          </TouchableOpacity>

          {/* Interests */}
          <TouchableOpacity style={styles.sectionCard} onPress={() => setSection('interests')} activeOpacity={0.7}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="tag-heart" size={20} color="#00E676" />
              <Text style={styles.sectionTitle}>Interests ({interests.length})</Text>
              <MaterialCommunityIcons name="chevron-right" size={20} color="#555" />
            </View>
            <View style={styles.interestPreview}>
              {interests.length > 0 ? (
                interests.slice(0, 5).map((interest) => (
                  <View key={interest} style={styles.interestChip}>
                    <Text style={styles.interestChipText}>{interest}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>Add interests to find better matches</Text>
              )}
              {interests.length > 5 && <Text style={styles.moreText}>+{interests.length - 5} more</Text>}
            </View>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // Photo editor
  if (section === 'photos') {
    const mainPhotoSize = (SCREEN_WIDTH - 48 - PHOTO_GAP) * 0.66;
    const thumbSize = (SCREEN_WIDTH - 48 - PHOTO_GAP * 2) / 3;
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <IconButton icon="arrow-left" size={24} onPress={() => setSection('overview')} iconColor="#FFF" />
          <Text variant="titleLarge" style={styles.headerTitle}>Photos</Text>
          <View style={{ width: 56 }} />
        </View>
        <View style={styles.editContent}>
          <Text style={styles.editDesc}>Tap a photo to remove it. Your first photo is your main profile picture.</Text>
          <View style={styles.photoGrid}>
            <TouchableOpacity
              style={[styles.mainPhoto, { width: mainPhotoSize, height: mainPhotoSize * 1.2 }]}
              onPress={photos[0] ? () => handleRemovePhoto(0) : handleAddPhoto}
              activeOpacity={0.8}
            >
              {photos[0] ? (
                <>
                  <Image source={{ uri: photos[0] }} style={styles.photoImage} />
                  <View style={styles.photoBadge}><Text style={styles.photoBadgeText}>MAIN</Text></View>
                </>
              ) : (
                <View style={styles.emptyPhoto}>
                  <MaterialCommunityIcons name="camera-plus" size={36} color="#555" />
                  <Text style={styles.emptyPhotoText}>Main Photo</Text>
                </View>
              )}
            </TouchableOpacity>
            <View style={styles.thumbColumn}>
              {Array.from({ length: 6 }).map((_, i) => {
                const photoIndex = i + 1;
                return (
                  <TouchableOpacity
                    key={i}
                    style={[styles.thumbPhoto, { width: thumbSize, height: thumbSize }]}
                    onPress={photos[photoIndex] ? () => handleRemovePhoto(photoIndex) : handleAddPhoto}
                    activeOpacity={0.8}
                  >
                    {photos[photoIndex] ? (
                      <Image source={{ uri: photos[photoIndex] }} style={styles.photoImage} />
                    ) : (
                      <View style={styles.emptyThumb}>
                        <MaterialCommunityIcons name="plus" size={20} color="#555" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
          <Text style={styles.photoCounter}>{photos.length}/{MAX_PHOTOS} photos</Text>
        </View>
      </View>
    );
  }

  // Bio editor
  if (section === 'bio') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <IconButton icon="arrow-left" size={24} onPress={() => setSection('overview')} iconColor="#FFF" />
          <Text variant="titleLarge" style={styles.headerTitle}>About You</Text>
          <Button mode="text" onPress={() => { setSection('overview'); }} textColor="#00E676">Done</Button>
        </View>
        <ScrollView style={styles.editContent} contentContainerStyle={{ paddingBottom: 40 }}>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Name</Text>
            <TextInput value={localName} onChangeText={setLocalName} mode="outlined" maxLength={50} placeholder="Your first name" placeholderTextColor="#555" outlineColor="#2A2A2A" activeOutlineColor="#00E676" theme={{ colors: { onSurfaceVariant: '#A0A0A0' } }} style={styles.textInput} />
          </View>
          <View style={styles.fieldGroup}>
            <View style={styles.fieldHeader}>
              <Text style={styles.fieldLabel}>Bio</Text>
              <Text style={styles.charCount}>{localBio.length}/500</Text>
            </View>
            <TextInput value={localBio} onChangeText={(t) => t.length <= 500 && setLocalBio(t)} mode="outlined" multiline numberOfLines={6} maxLength={500} placeholder="Tell people about yourself..." placeholderTextColor="#555" outlineColor="#2A2A2A" activeOutlineColor="#00E676" theme={{ colors: { onSurfaceVariant: '#A0A0A0' } }} style={[styles.textInput, { minHeight: 140 }]} />
          </View>
          <View style={styles.tipCard}>
            <MaterialCommunityIcons name="lightbulb-outline" size={18} color="#FFD600" />
            <Text style={styles.tipText}>Tip: Include your hobbies, what you're looking for, and something unique about you!</Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  // Interests editor
  if (section === 'interests') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <IconButton icon="arrow-left" size={24} onPress={() => setSection('overview')} iconColor="#FFF" />
          <Text variant="titleLarge" style={styles.headerTitle}>Interests</Text>
          <Button mode="text" onPress={() => setSection('overview')} textColor="#00E676">Done</Button>
        </View>
        <View style={styles.editContent}>
          <View style={styles.searchBar}>
            <MaterialCommunityIcons name="magnify" size={20} color="#555" />
            <TextInput placeholder="Search interests" value={interestSearch} onChangeText={setInterestSearch} style={styles.searchInput} underlineColor="transparent" activeUnderlineColor="transparent" placeholderTextColor="#555" theme={{ colors: { onSurfaceVariant: '#A0A0A0' } }} />
          </View>
          {interests.length > 0 && (
            <View style={styles.selectedBar}>
              <Text style={styles.selectedCount}>{interests.length}/{MAX_INTERESTS} selected</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {interests.map((interest) => (
                  <TouchableOpacity key={interest} onPress={() => toggleInterest(interest)}>
                    <View style={styles.selectedChip}>
                      <Text style={styles.selectedChipText}>{interest}</Text>
                      <MaterialCommunityIcons name="close" size={12} color="#00E676" />
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
          <ScrollView style={styles.interestsGrid} contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingBottom: 20 }}>
            {filteredInterests.map((interest) => {
              const isSelected = interests.includes(interest);
              return (
                <TouchableOpacity key={interest} onPress={() => toggleInterest(interest)} activeOpacity={0.7} style={[styles.interestTag, isSelected && styles.interestTagSelected]}>
                  <Text style={[styles.interestTagText, isSelected && styles.interestTagTextSelected]}>{interest}</Text>
                  {isSelected && <MaterialCommunityIcons name="check" size={14} color="#000" />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 50, paddingBottom: 8, backgroundColor: '#0A0A0A' },
  headerTitle: { fontWeight: 'bold', color: '#FFFFFF' },
  content: { flex: 1 },
  editContent: { flex: 1, paddingHorizontal: 24, paddingTop: 16 },

  // Section cards
  sectionCard: { backgroundColor: '#141414', borderRadius: 16, padding: 16, marginBottom: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  sectionTitle: { flex: 1, fontSize: 16, fontWeight: 'bold', color: '#FFFFFF' },
  bioPreview: { gap: 4 },
  bioName: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  bioText: { fontSize: 13, color: '#A0A0A0', lineHeight: 18 },
  interestPreview: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  interestChip: { backgroundColor: '#1C1C1C', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  interestChipText: { fontSize: 12, color: '#00E676' },
  moreText: { fontSize: 12, color: '#555', alignSelf: 'center' },
  emptyText: { fontSize: 13, color: '#555' },

  // Photo editor
  editDesc: { color: '#A0A0A0', textAlign: 'center', marginBottom: 20, fontSize: 13 },
  photoGrid: { flexDirection: 'row', gap: PHOTO_GAP },
  mainPhoto: { borderRadius: 12, overflow: 'hidden', backgroundColor: '#1C1C1C' },
  thumbColumn: { flex: 1, gap: PHOTO_GAP, flexWrap: 'wrap' },
  thumbPhoto: { borderRadius: 8, overflow: 'hidden', backgroundColor: '#1C1C1C' },
  photoImage: { width: '100%', height: '100%' },
  emptyPhoto: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#141414', borderWidth: 2, borderStyle: 'dashed', borderColor: '#2A2A2A' },
  emptyThumb: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#141414', borderWidth: 1, borderStyle: 'dashed', borderColor: '#2A2A2A' },
  emptyPhotoText: { color: '#555', fontSize: 12, marginTop: 4 },
  photoBadge: { position: 'absolute', bottom: 8, left: 8, backgroundColor: 'rgba(0,230,118,0.9)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  photoBadgeText: { color: '#000', fontSize: 10, fontWeight: 'bold' },
  photoPreview: { flexDirection: 'row', gap: 8 },
  previewThumb: { borderRadius: 8, overflow: 'hidden' },
  previewThumbImage: { width: '100%', height: '100%' },
  previewEmpty: { backgroundColor: '#1C1C1C', borderWidth: 1, borderStyle: 'dashed', borderColor: '#2A2A2A', justifyContent: 'center', alignItems: 'center' },
  photoCounter: { textAlign: 'center', color: '#555', marginTop: 16, fontSize: 13 },

  // Bio editor
  fieldGroup: { marginBottom: 20 },
  fieldHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  fieldLabel: { fontSize: 14, fontWeight: '600', color: '#FFFFFF', marginBottom: 8 },
  textInput: { backgroundColor: '#141414' },
  charCount: { fontSize: 12, color: '#555' },
  tipCard: { flexDirection: 'row', backgroundColor: '#1C1C1C', borderRadius: 12, padding: 14, gap: 10, alignItems: 'flex-start' },
  tipText: { flex: 1, fontSize: 13, color: '#A0A0A0', lineHeight: 18 },

  // Interests
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#141414', borderRadius: 12, paddingHorizontal: 12, height: 44, marginBottom: 12, gap: 8 },
  searchInput: { flex: 1, backgroundColor: 'transparent', fontSize: 15, minHeight: 0, paddingVertical: 0, color: '#FFF' },
  selectedBar: { marginBottom: 12, gap: 8 },
  selectedCount: { fontSize: 12, color: '#555' },
  selectedChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: '#1B3A2A', marginRight: 6, gap: 4 },
  selectedChipText: { fontSize: 12, color: '#00E676', fontWeight: '500' },
  interestsGrid: { flex: 1 },
  interestTag: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#1C1C1C', gap: 4 },
  interestTagSelected: { backgroundColor: '#00E676' },
  interestTagText: { fontSize: 13, color: '#E0E0E0' },
  interestTagTextSelected: { color: '#000', fontWeight: '500' },
});
