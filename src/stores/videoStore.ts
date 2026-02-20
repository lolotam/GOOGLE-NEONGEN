import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface GeneratedVideo {
  id: string;
  url: string;
  prompt: string;
  model: string;
  aspectRatio: string;
  duration: string;
  timestamp: number;
}

interface VideoState {
  prompt: string;
  selectedModel: string;
  aspectRatio: string;
  duration: string;
  resolution: string;
  isGenerating: boolean;
  generatedVideos: GeneratedVideo[];
  currentVideo: GeneratedVideo | null;
  generationStatus: string;

  setPrompt: (prompt: string) => void;
  setSelectedModel: (model: string) => void;
  setAspectRatio: (ratio: string) => void;
  setDuration: (duration: string) => void;
  setResolution: (resolution: string) => void;
  setGenerating: (generating: boolean) => void;
  addVideo: (video: GeneratedVideo) => void;
  setCurrentVideo: (video: GeneratedVideo | null) => void;
  deleteVideo: (id: string) => void;
  setGenerationStatus: (status: string) => void;
}

export const useVideoStore = create<VideoState>()(
  persist(
    (set) => ({
      prompt: '',
      selectedModel: 'veo-3.1-fast-generate-preview',
      aspectRatio: '16:9',
      duration: '5', // Default for fast model
      resolution: '720p',
      isGenerating: false,
      generatedVideos: [],
      currentVideo: null,
      generationStatus: '',

      setPrompt: (prompt) => set({ prompt }),
      setSelectedModel: (selectedModel) => set({ selectedModel }),
      setAspectRatio: (aspectRatio) => set({ aspectRatio }),
      setDuration: (duration) => set({ duration }),
      setResolution: (resolution) => set({ resolution }),
      setGenerating: (isGenerating) => set({ isGenerating }),
      
      addVideo: (video) => set((state) => ({ 
        generatedVideos: [video, ...state.generatedVideos],
        currentVideo: video
      })),
      
      setCurrentVideo: (currentVideo) => set({ currentVideo }),
      
      deleteVideo: (id) => set((state) => ({
        generatedVideos: state.generatedVideos.filter((vid) => vid.id !== id),
        currentVideo: state.currentVideo?.id === id ? null : state.currentVideo
      })),
      
      setGenerationStatus: (status) => set({ generationStatus: status }),
    }),
    {
      name: 'neongen-video-storage',
    }
  )
);
