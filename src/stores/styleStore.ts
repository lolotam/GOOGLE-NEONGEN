import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { TrainingStatus } from '@/lib/api/fal';

/**
 * Represents a trained style profile.
 * Contains both legacy Gemini analysis data and new LoRA training data.
 */
export interface StyleProfile {
  /** Unique identifier */
  id: string;
  /** User-defined profile name */
  name: string;
  /** AI-generated description of the style/character (Gemini analysis) */
  description: string;
  /** One representative image (base64 data URI) */
  thumbnail: string;
  /** A subset of reference images (max 5) kept for direct reference */
  referenceImages: string[];
  /** Creation timestamp (Unix ms) */
  createdAt: number;

  // LoRA training fields
  /** Style type: person, art_style, or character */
  styleType?: 'person' | 'art_style' | 'character';
  /** URL of trained LoRA weights (available after training completes) */
  loraUrl?: string;
  /** Auto-generated trigger word for prompt injection */
  triggerWord?: string;
  /** fal.ai training job ID */
  trainingJobId?: string;
  /** Current training status */
  trainingStatus?: TrainingStatus;
  /** Training progress 0-100 */
  trainingProgress?: number;
  /** Number of images used for training */
  imageCount?: number;
  /** Error message if training failed */
  trainingError?: string;
}

interface StyleStore {
  profiles: StyleProfile[];
  isAnalyzing: boolean;
  analysisProgress: number;

  /** Add a new profile (legacy Gemini or LoRA) */
  addProfile: (profile: StyleProfile) => void;
  /** Delete a profile by ID */
  deleteProfile: (id: string) => void;
  /** Set analysis state (legacy Gemini flow) */
  setAnalyzing: (isAnalyzing: boolean, progress?: number) => void;
  /** Get a profile by ID */
  getProfile: (id: string) => StyleProfile | undefined;

  // LoRA training actions
  /** Start a new LoRA training job — creates profile with pending status */
  startTraining: (profile: Omit<StyleProfile, 'description' | 'referenceImages'> & {
    trainingJobId: string;
    triggerWord: string;
  }) => void;
  /** Update training status and progress for a job */
  updateTrainingStatus: (
    id: string,
    status: TrainingStatus,
    progress: number,
    loraUrl?: string,
    triggerWord?: string,
    errorMessage?: string
  ) => void;
  /** Get all profiles with completed LoRA training */
  getCompletedProfiles: () => StyleProfile[];
}

/**
 * Zustand store for style profiles.
 * Persists only the profiles array to localStorage.
 * Supports both legacy Gemini-analyzed profiles and LoRA-trained profiles.
 */
export const useStyleStore = create<StyleStore>()(
  persist(
    (set, get) => ({
      profiles: [],
      isAnalyzing: false,
      analysisProgress: 0,

      addProfile: (profile) => set((state) => ({
        profiles: [profile, ...state.profiles]
      })),

      deleteProfile: (id) => set((state) => ({
        profiles: state.profiles.filter((p) => p.id !== id)
      })),

      setAnalyzing: (isAnalyzing, progress = 0) => set({
        isAnalyzing,
        analysisProgress: progress
      }),

      getProfile: (id) => get().profiles.find((p) => p.id === id),

      startTraining: (profile) => set((state) => ({
        profiles: [
          {
            ...profile,
            description: '',
            referenceImages: [],
            trainingStatus: 'pending',
            trainingProgress: 0,
          },
          ...state.profiles,
        ],
      })),

      updateTrainingStatus: (id, status, progress, loraUrl, triggerWord, errorMessage) => {
        set((state) => ({
          profiles: state.profiles.map((p) => {
            if (p.id !== id) return p;
            return {
              ...p,
              trainingStatus: status,
              trainingProgress: progress,
              ...(loraUrl !== undefined && { loraUrl }),
              ...(triggerWord !== undefined && { triggerWord }),
              ...(errorMessage !== undefined && { trainingError: errorMessage }),
            };
          }),
        }));
      },

      getCompletedProfiles: () =>
        get().profiles.filter(
          (p) => p.trainingStatus === 'completed' && !!p.loraUrl
        ),
    }),
    {
      name: 'neongen-style-profiles',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ profiles: state.profiles }),
    }
  )
);
