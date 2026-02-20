import { useVideoStore } from '@/stores/videoStore';
import { Download, Trash2, Maximize2, X, Play } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export const VideoOutput = () => {
  const { currentVideo, isGenerating, deleteVideo, setCurrentVideo, generationStatus } = useVideoStore();
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleDownload = () => {
    if (!currentVideo) return;
    const link = document.createElement('a');
    link.href = currentVideo.url;
    link.download = `neongen-video-${currentVideo.id}.mp4`;
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
            <p className="text-primary-neon font-medium animate-pulse">{generationStatus}</p>
          </motion.div>
        ) : currentVideo ? (
          <motion.div
            key="video"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative max-w-full max-h-full group w-full flex justify-center"
          >
            <video 
              src={currentVideo.url} 
              controls
              autoPlay
              loop
              className="max-w-full max-h-[80vh] rounded-xl shadow-2xl border border-white/10"
            />
            
            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={handleDownload}
                className="p-2 rounded-lg bg-black/50 hover:bg-black/70 text-white backdrop-blur-sm transition-colors"
                title="Download"
              >
                <Download className="w-5 h-5" />
              </button>
              <button 
                onClick={() => {
                    deleteVideo(currentVideo.id);
                    setCurrentVideo(null);
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
              <Play className="w-8 h-8 opacity-20" />
            </div>
            <p>Enter a prompt to generate a video</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
