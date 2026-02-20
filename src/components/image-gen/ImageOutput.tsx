import { useImageStore } from '@/stores/imageStore';
import { Download, Trash2, Maximize2, X } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export const ImageOutput = () => {
  const { currentImage, isGenerating, deleteImage, setCurrentImage } = useImageStore();
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleDownload = () => {
    if (!currentImage) return;
    const link = document.createElement('a');
    link.href = currentImage.url;
    link.download = `neongen-${currentImage.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 h-full relative flex flex-col items-center justify-center p-8 bg-background-primary/50">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{ 
             backgroundImage: 'radial-gradient(circle at 1px 1px, #333 1px, transparent 0)',
             backgroundSize: '40px 40px' 
           }} 
      />

      <AnimatePresence mode="wait">
        {isGenerating ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4"
          >
            <div className="w-16 h-16 border-4 border-primary-neon/30 border-t-primary-neon rounded-full animate-spin" />
            <p className="text-primary-neon font-medium animate-pulse">Creating masterpiece...</p>
          </motion.div>
        ) : currentImage ? (
          <motion.div
            key="image"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative max-w-full max-h-full group"
          >
            <img 
              src={currentImage.url} 
              alt={currentImage.prompt}
              className="max-w-full max-h-[80vh] rounded-xl shadow-2xl border border-white/10"
            />
            
            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => setIsFullscreen(true)}
                className="p-2 rounded-lg bg-black/50 hover:bg-black/70 text-white backdrop-blur-sm transition-colors"
                title="Fullscreen"
              >
                <Maximize2 className="w-5 h-5" />
              </button>
              <button 
                onClick={handleDownload}
                className="p-2 rounded-lg bg-black/50 hover:bg-black/70 text-white backdrop-blur-sm transition-colors"
                title="Download"
              >
                <Download className="w-5 h-5" />
              </button>
              <button 
                onClick={() => {
                    deleteImage(currentImage.id);
                    setCurrentImage(null);
                }}
                className="p-2 rounded-lg bg-red-500/50 hover:bg-red-500/70 text-white backdrop-blur-sm transition-colors"
                title="Delete"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-gray-500"
          >
            <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center mx-auto mb-4">
              <Download className="w-8 h-8 opacity-20" />
            </div>
            <p>Enter a prompt to generate an image</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fullscreen Modal */}
      <AnimatePresence>
        {isFullscreen && currentImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-8"
          >
            <button 
              onClick={() => setIsFullscreen(false)}
              className="absolute top-4 right-4 p-2 text-white/50 hover:text-white"
            >
              <X className="w-8 h-8" />
            </button>
            <img 
              src={currentImage.url} 
              alt={currentImage.prompt}
              className="max-w-full max-h-full object-contain"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
