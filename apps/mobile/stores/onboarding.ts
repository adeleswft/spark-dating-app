import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { safeStorage } from '../services/storage';

interface OnboardingState {
  // Progress
  currentStep: number;
  isComplete: boolean;

  // Step 1: Photos
  photos: string[];

  // Step 2: Bio
  name: string;
  bio: string;
  dob: string;
  gender: 'male' | 'female' | 'non-binary' | 'other' | null;

  // Step 3: Interests
  interests: string[];

  // Step 4: Preferences
  minAge: number;
  maxAge: number;
  maxDistance: number;
  genderPreference: ('male' | 'female' | 'non-binary' | 'other')[];
  relationshipGoals: 'casual' | 'serious' | 'friends' | 'unsure';

  // Actions
  setStep: (step: number) => void;
  addPhoto: (uri: string) => void;
  removePhoto: (index: number) => void;
  reorderPhotos: (from: number, to: number) => void;
  setBio: (bio: string) => void;
  setName: (name: string) => void;
  setDob: (dob: string) => void;
  setGender: (gender: 'male' | 'female' | 'non-binary' | 'other') => void;
  toggleInterest: (interest: string) => void;
  setPreferences: (prefs: Partial<Pick<OnboardingState, 'minAge' | 'maxAge' | 'maxDistance' | 'genderPreference' | 'relationshipGoals'>>) => void;
  completeOnboarding: () => void;
  reset: () => void;
}

const INTEREST_CATEGORIES: Record<string, string[]> = {
  'Sports & Fitness': ['Running', 'Yoga', 'Gym', 'Hiking', 'Swimming', 'Cycling', 'Tennis', 'Basketball', 'Soccer', 'Rock Climbing'],
  'Food & Drink': ['Coffee', 'Cooking', 'Wine', 'Craft Beer', 'Sushi', 'Italian', 'Vegan', 'Baking', 'Street Food', 'Fine Dining'],
  'Arts & Culture': ['Photography', 'Painting', 'Museum', 'Theater', 'Film', 'Music', 'Concerts', 'Books', 'Poetry', 'Dance'],
  'Tech & Gaming': ['Technology', 'Gaming', 'AI', 'Coding', 'Podcasts', 'Startups', 'Science', 'Space', 'Robotics', 'VR'],
  'Travel & Nature': ['Travel', 'Beach', 'Mountains', 'Camping', 'Road Trips', 'Backpacking', 'Surfing', 'Nature', 'Sunsets', 'National Parks'],
  'Lifestyle': ['Dogs', 'Cats', 'Meditation', 'Fashion', 'Tattoos', 'Volunteering', 'Astrology', 'DIY', 'Gardening', 'Board Games'],
};

export const ALL_INTERESTS = Object.values(INTEREST_CATEGORIES).flat();
export const INTEREST_CATEGORY_MAP = INTEREST_CATEGORIES;

const initialState = {
  currentStep: 0,
  isComplete: false,
  photos: [] as string[],
  name: '',
  bio: '',
  dob: '',
  gender: null as 'male' | 'female' | 'non-binary' | 'other' | null,
  interests: [] as string[],
  minAge: 18,
  maxAge: 50,
  maxDistance: 50,
  genderPreference: [] as ('male' | 'female' | 'non-binary' | 'other')[],
  relationshipGoals: 'unsure' as const,
};

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      ...initialState,

      setStep: (step) => set({ currentStep: step }),

      addPhoto: (uri) =>
        set((state) => ({
          photos: state.photos.length < 9 ? [...state.photos, uri] : state.photos,
        })),

      removePhoto: (index) =>
        set((state) => ({
          photos: state.photos.filter((_, i) => i !== index),
        })),

      reorderPhotos: (from, to) =>
        set((state) => {
          if (from < 0 || from >= state.photos.length || to < 0 || to >= state.photos.length) return state;
          const updated = [...state.photos];
          const [moved] = updated.splice(from, 1);
          if (moved === undefined) return state;
          updated.splice(to, 0, moved);
          return { photos: updated };
        }),

      setBio: (bio) => set({ bio }),
      setName: (name) => set({ name }),
      setDob: (dob) => set({ dob }),
      setGender: (gender) => set({ gender }),

      toggleInterest: (interest) =>
        set((state) => ({
          interests: state.interests.includes(interest)
            ? state.interests.filter((i) => i !== interest)
            : state.interests.length < 15
            ? [...state.interests, interest]
            : state.interests,
        })),

      setPreferences: (prefs) => set((state) => ({ ...state, ...prefs })),

      completeOnboarding: () => set({ isComplete: true }),

      reset: () => set(initialState),
    }),
    {
      name: 'spark-onboarding',
      storage: createJSONStorage(() => safeStorage),
    }
  )
);
