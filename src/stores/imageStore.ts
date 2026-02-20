import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  model: string;
  aspectRatio: string;
  timestamp: number;
}

interface ImageState {
  prompt: string;
  negativePrompt: string;
  selectedModel: string;
  aspectRatio: string;
  referenceImage: string | null;
  isGenerating: boolean;
  generatedImages: GeneratedImage[];
  currentImage: GeneratedImage | null;

  setPrompt: (prompt: string) => void;
  setNegativePrompt: (prompt: string) => void;
  setSelectedModel: (model: string) => void;
  setAspectRatio: (ratio: string) => void;
  setReferenceImage: (image: string | null) => void;
  setGenerating: (generating: boolean) => void;
  addImage: (image: GeneratedImage) => void;
  setCurrentImage: (image: GeneratedImage | null) => void;
  deleteImage: (id: string) => void;
}

export const useImageStore = create<ImageState>()(
  persist(
    (set) => ({
      prompt: '',
      negativePrompt: '',
      selectedModel: 'gemini-2.5-flash-image',
      aspectRatio: '1:1',
      referenceImage: null,
      isGenerating: false,
      generatedImages: [],
      currentImage: null,

      setPrompt: (prompt) => set({ prompt }),
      setNegativePrompt: (negativePrompt) => set({ negativePrompt }),
      setSelectedModel: (selectedModel) => set({ selectedModel }),
      setAspectRatio: (aspectRatio) => set({ aspectRatio }),
      setReferenceImage: (referenceImage) => set({ referenceImage }),
      setGenerating: (isGenerating) => set({ isGenerating }),
      
      addImage: (image) => set((state) => ({ 
        generatedImages: [image, ...state.generatedImages],
        currentImage: image
      })),
      
      setCurrentImage: (currentImage) => set({ currentImage }),
      
      deleteImage: (id) => set((state) => ({
        generatedImages: state.generatedImages.filter((img) => img.id !== id),
        currentImage: state.currentImage?.id === id ? null : state.currentImage
      })),
    }),
    {
      name: 'neongen-image-storage',
    }
  )
);
