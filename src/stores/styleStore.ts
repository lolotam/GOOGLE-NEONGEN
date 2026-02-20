import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface StyleProfile {
  id: string;
  name: string;
  description: string; // The AI-generated description of the style/character
  thumbnail: string; // One representative image
  referenceImages: string[]; // A subset of images (max 5) kept for direct reference
  createdAt: number;
}

interface StyleStore {
  profiles: StyleProfile[];
  isAnalyzing: boolean;
  analysisProgress: number;
  
  addProfile: (profile: StyleProfile) => void;
  deleteProfile: (id: string) => void;
  setAnalyzing: (isAnalyzing: boolean, progress?: number) => void;
  getProfile: (id: string) => StyleProfile | undefined;
}

// Custom storage to handle larger data (though still limited by localStorage quota)
// In a real app, this would be IndexedDB or server-side
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
    }),
    {
      name: 'neongen-style-profiles',
      storage: createJSONStorage(() => localStorage),
      partial: (state) => ({ profiles: state.profiles }), // Only persist profiles
    }
  )
);
