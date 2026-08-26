import React, { useState } from 'react';
import { View, StyleSheet, Image, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { Text, Button, IconButton } from 'react-native-paper';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useOnboardingStore } from '../../stores/onboarding';
import OnboardingProgress from '../../components/OnboardingProgress';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAX_PHOTOS = 9;
const PHOTO_GAP = 4;

export default function PhotosScreen() {
  const router = useRouter();
  const { photos, addPhoto, removePhoto } = useOnboardingStore();
  const [loading, setLoading] = useState(false);

  const pickImage = async (useCamera: boolean) => {
    try {
      setLoading(true);
      let result;
      if (useCamera) {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Permission needed', 'Camera permission is required.');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [3, 4],
          quality: 0.8,
        });
      } else {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Permission needed', 'Gallery permission is required.');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [3, 4],
          quality: 0.8,
        });
      }
      if (!result.canceled && result.assets[0]) {
        addPhoto(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePhoto = (index: number) => {
    Alert.alert('Remove Photo', 'Remove this photo?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removePhoto(index) },
    ]);
  };

  const showPicker = () => {
    Alert.alert('Add Photo', 'Choose a source', [
      { text: 'Camera', onPress: () => pickImage(true) },
      { text: 'Gallery', onPress: () => pickImage(false) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const canProceed = photos.length >= 2;
  const mainPhotoSize = (SCREEN_WIDTH - 48 - PHOTO_GAP) * 0.66;
  const thumbSize = (SCREEN_WIDTH - 48 - PHOTO_GAP * 2) / 3;

  return (
    <View style={styles.container}>
      <OnboardingProgress currentStep={0} totalSteps={4} title="Add Photos" />

      <View style={styles.content}>
        <Text style={styles.description}>
          Add at least 2 photos. Your first photo is your main profile picture.
        </Text>

        <View style={styles.photoGrid}>
          <TouchableOpacity
            style={[styles.mainPhoto, { width: mainPhotoSize, height: mainPhotoSize * 1.2 }]}
            onPress={photos[0] ? () => handleRemovePhoto(0) : showPicker}
            activeOpacity={0.8}
          >
            {photos[0] ? (
              <>
                <Image source={{ uri: photos[0] }} style={styles.photoImage} />
                <View style={styles.photoNumber}>
                  <Text style={styles.photoNumberText}>1</Text>
                </View>
              </>
            ) : (
              <View style={styles.emptyMainPhoto}>
                <MaterialCommunityIcons name="camera-plus" size={40} color="#555" />
                <Text style={styles.emptyText}>Photo 1</Text>
                <Text style={styles.emptyHint}>Main photo</Text>
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
                  onPress={photos[photoIndex] ? () => handleRemovePhoto(photoIndex) : showPicker}
                  activeOpacity={0.8}
                >
                  {photos[photoIndex] ? (
                    <>
                      <Image source={{ uri: photos[photoIndex] }} style={styles.photoImage} />
                      <View style={styles.photoNumberSmall}>
                        <Text style={styles.photoNumberTextSmall}>{photoIndex + 1}</Text>
                      </View>
                    </>
                  ) : (
                    <View style={styles.emptyThumbPhoto}>
                      <MaterialCommunityIcons name="plus" size={24} color="#555" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <Text style={styles.counter}>
          {photos.length}/{MAX_PHOTOS} photos{photos.length < 2 ? ` • Add ${2 - photos.length} more` : ''}
        </Text>
      </View>

      <View style={styles.footer}>
        <Button
          mode="contained"
          onPress={() => router.push('/(onboarding)/bio')}
          disabled={!canProceed}
          style={[styles.nextButton, !canProceed && styles.nextButtonDisabled]}
          labelStyle={styles.nextButtonLabel}
        >
          CONTINUE
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  content: { flex: 1, paddingHorizontal: 24 },
  description: { color: '#A0A0A0', textAlign: 'center', marginBottom: 20, fontSize: 14, lineHeight: 20 },
  photoGrid: { flexDirection: 'row', gap: PHOTO_GAP },
  mainPhoto: { borderRadius: 12, overflow: 'hidden', backgroundColor: '#1C1C1C' },
  thumbColumn: { flex: 1, gap: PHOTO_GAP, flexWrap: 'wrap' },
  thumbPhoto: { borderRadius: 8, overflow: 'hidden', backgroundColor: '#1C1C1C' },
  photoImage: { width: '100%', height: '100%' },
  emptyMainPhoto: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#141414', borderWidth: 2, borderStyle: 'dashed', borderColor: '#2A2A2A' },
  emptyThumbPhoto: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#141414', borderWidth: 1, borderStyle: 'dashed', borderColor: '#2A2A2A' },
  emptyText: { color: '#A0A0A0', fontSize: 13, marginTop: 6 },
  emptyHint: { color: '#555', fontSize: 11, marginTop: 2 },
  photoNumber: { position: 'absolute', bottom: 8, left: 8, width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(0,230,118,0.8)', justifyContent: 'center', alignItems: 'center' },
  photoNumberText: { color: '#000', fontSize: 12, fontWeight: 'bold' },
  photoNumberSmall: { position: 'absolute', bottom: 4, left: 4, width: 18, height: 18, borderRadius: 9, backgroundColor: 'rgba(0,230,118,0.8)', justifyContent: 'center', alignItems: 'center' },
  photoNumberTextSmall: { color: '#000', fontSize: 9, fontWeight: 'bold' },
  counter: { textAlign: 'center', color: '#A0A0A0', marginTop: 16, fontSize: 13 },
  footer: { paddingHorizontal: 24, paddingBottom: 40 },
  nextButton: { backgroundColor: '#00E676', borderRadius: 30, paddingVertical: 4 },
  nextButtonDisabled: { backgroundColor: '#2A2A2A' },
  nextButtonLabel: { color: '#000', fontWeight: 'bold', letterSpacing: 1, fontSize: 15 },
});
