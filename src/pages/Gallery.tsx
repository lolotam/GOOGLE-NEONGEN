import { useState, useMemo } from 'react';
import { useImageStore } from '@/stores/imageStore';
import { useVideoStore } from '@/stores/videoStore';
import { Search, Filter, Image as ImageIcon, Video, Calendar, Maximize2, X, Download, Trash2, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

type GalleryItem = {
  id: string;
  type: 'image' | 'video';
  url: string;
  prompt: string;
  model: string;
  aspectRatio: string;
  timestamp: number;
  duration?: string;
};

export default function Gallery() {
  const { generatedImages, deleteImage } = useImageStore();
  const { generatedVideos, deleteVideo } = useVideoStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'image' | 'video'>('all');
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);

  // Combine and sort items
  const allItems: GalleryItem[] = useMemo(() => {
    const images: GalleryItem[] = generatedImages.map(img => ({ ...img, type: 'image' }));
    const videos: GalleryItem[] = generatedVideos.map(vid => ({ ...vid, type: 'video' }));
    return [...images, ...videos].sort((a, b) => b.timestamp - a.timestamp);
  }, [generatedImages, generatedVideos]);

  // Filter items
  const filteredItems = useMemo(() => {
    return allItems.filter(item => {
      const matchesSearch = item.prompt.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = filterType === 'all' || item.type === filterType;
      return matchesSearch && matchesType;
    });
  }, [allItems, searchQuery, filterType]);

  const handleDelete = (e: React.MouseEvent, item: GalleryItem) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this item?')) {
      if (item.type === 'image') {
        deleteImage(item.id);
      } else {
        deleteVideo(item.id);
      }
      if (selectedItem?.id === item.id) {
        setSelectedItem(null);
      }
    }
  };

  const handleDownload = (e: React.MouseEvent, item: GalleryItem) => {
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = item.url;
    link.download = `neongen-${item.type}-${item.id}.${item.type === 'image' ? 'png' : 'mp4'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen p-6 lg:p-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-display font-bold mb-2">My Gallery</h1>
            <p className="text-gray-400">Manage your generated masterpieces</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search prompts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-64 bg-background-secondary border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-primary-neon/50"
              />
            </div>

            {/* Filter Toggle */}
            <div className="flex bg-background-secondary p-1 rounded-xl border border-white/10">
              <button
                onClick={() => setFilterType('all')}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-sm font-medium transition-all",
                  filterType === 'all' ? "bg-white/10 text-white" : "text-gray-400 hover:text-white"
                )}
              >
                All
              </button>
              <button
                onClick={() => setFilterType('image')}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
                  filterType === 'image' ? "bg-primary-neon/20 text-primary-neon" : "text-gray-400 hover:text-white"
                )}
              >
                <ImageIcon className="w-4 h-4" />
                Images
              </button>
              <button
                onClick={() => setFilterType('video')}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
                  filterType === 'video' ? "bg-primary-orange/20 text-primary-orange" : "text-gray-400 hover:text-white"
                )}
              >
                <Video className="w-4 h-4" />
                Videos
              </button>
            </div>
          </div>
        </div>

        {/* Grid */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-20 bg-background-secondary/30 rounded-3xl border border-white/5">
            <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-6">
              <ImageIcon className="w-10 h-10 text-gray-600" />
            </div>
            <h3 className="text-xl font-bold mb-2">No items found</h3>
            <p className="text-gray-400">Start generating to populate your gallery</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map((item) => (
              <motion.div
                layout
                key={item.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ y: -5 }}
                className="group relative aspect-square rounded-2xl overflow-hidden bg-background-secondary border border-white/5 cursor-pointer"
                onClick={() => setSelectedItem(item)}
              >
                {item.type === 'image' ? (
                  <img 
                    src={item.url} 
                    alt={item.prompt}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                ) : (
                  <video 
                    src={item.url}
                    className="w-full h-full object-cover"
                  />
                )}

                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
                  <div className="absolute top-4 right-4 flex gap-2">
                    <button 
                      onClick={(e) => handleDownload(e, item)}
                      className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm transition-colors"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={(e) => handleDelete(e, item)}
                      className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-500 backdrop-blur-sm transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-medium text-primary-neon">
                      {item.type === 'image' ? <ImageIcon className="w-3 h-3" /> : <Video className="w-3 h-3" />}
                      <span className="uppercase">{item.model}</span>
                    </div>
                    <p className="text-sm text-white line-clamp-2 font-medium">{item.prompt}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(item.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Video Indicator */}
                {item.type === 'video' && (
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:opacity-0 transition-opacity">
                    <Play className="w-5 h-5 fill-white text-white ml-1" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 lg:p-8"
            onClick={() => setSelectedItem(null)}
          >
            <button 
              onClick={() => setSelectedItem(null)}
              className="absolute top-4 right-4 p-2 text-white/50 hover:text-white transition-colors"
            >
              <X className="w-8 h-8" />
            </button>

            <div 
              className="relative w-full max-w-6xl max-h-full flex flex-col lg:flex-row gap-8 bg-background-secondary/50 rounded-3xl overflow-hidden border border-white/10"
              onClick={e => e.stopPropagation()}
            >
              {/* Media Preview */}
              <div className="flex-1 bg-black/50 flex items-center justify-center p-4 min-h-[400px]">
                {selectedItem.type === 'image' ? (
                  <img 
                    src={selectedItem.url} 
                    alt={selectedItem.prompt}
                    className="max-w-full max-h-[70vh] object-contain rounded-lg"
                  />
                ) : (
                  <video 
                    src={selectedItem.url}
                    controls
                    autoPlay
                    className="max-w-full max-h-[70vh] rounded-lg"
                  />
                )}
              </div>

              {/* Details Sidebar */}
              <div className="w-full lg:w-96 p-8 bg-background-secondary border-l border-white/5 flex flex-col">
                <div className="flex-1 space-y-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-2">Prompt</h3>
                    <p className="text-white leading-relaxed">{selectedItem.prompt}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-400 mb-1">Model</h3>
                      <p className="text-sm text-white font-mono">{selectedItem.model}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-400 mb-1">Date</h3>
                      <p className="text-sm text-white font-mono">
                        {new Date(selectedItem.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-400 mb-1">Aspect Ratio</h3>
                      <p className="text-sm text-white font-mono">{selectedItem.aspectRatio}</p>
                    </div>
                    {selectedItem.duration && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-400 mb-1">Duration</h3>
                        <p className="text-sm text-white font-mono">{selectedItem.duration}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 mt-8 pt-8 border-t border-white/5">
                  <button 
                    onClick={(e) => handleDownload(e, selectedItem)}
                    className="flex-1 py-3 rounded-xl bg-primary-neon text-background-primary font-bold hover:bg-primary-lime transition-colors flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                  <button 
                    onClick={(e) => {
                      handleDelete(e, selectedItem);
                    }}
                    className="px-4 py-3 rounded-xl bg-white/5 text-red-500 hover:bg-red-500/10 transition-colors border border-white/5"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
