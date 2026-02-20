import { useImageStore } from '@/stores/imageStore';
import { cn } from '@/lib/utils';
import { Trash2 } from 'lucide-react';

export const ImageHistory = () => {
  const { generatedImages, currentImage, setCurrentImage, deleteImage } = useImageStore();

  if (generatedImages.length === 0) return null;

  return (
    <div className="h-32 border-t border-white/5 bg-background-secondary/30 p-4 overflow-x-auto">
      <div className="flex gap-4 min-w-max">
        {generatedImages.map((img) => (
          <div 
            key={img.id}
            className={cn(
              "relative w-24 h-24 rounded-lg overflow-hidden cursor-pointer border-2 transition-all group",
              currentImage?.id === img.id 
                ? "border-primary-neon" 
                : "border-transparent hover:border-white/20"
            )}
            onClick={() => setCurrentImage(img)}
          >
            <img 
              src={img.url} 
              alt={img.prompt}
              className="w-full h-full object-cover"
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteImage(img.id);
              }}
              className="absolute top-1 right-1 p-1 rounded bg-black/50 text-white opacity-0 group-hover:opacity-100 hover:bg-red-500 transition-all"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
