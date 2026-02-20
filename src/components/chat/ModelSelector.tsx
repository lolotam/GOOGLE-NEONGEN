import { useChatStore } from '@/stores/chatStore';
import { ChevronDown, Zap, Sparkles, Clock } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

const models = [
  {
    id: 'gemini-3-pro-preview',
    name: 'Gemini 3 Pro',
    description: 'Most capable model for complex tasks',
    icon: Sparkles,
    badge: 'Best'
  },
  {
    id: 'gemini-3-flash-preview',
    name: 'Gemini 3 Flash',
    description: 'Fast and efficient for most tasks',
    icon: Zap,
    badge: 'Fast'
  },
  {
    id: 'gemini-flash-latest',
    name: 'Gemini Flash Latest',
    description: 'Latest stable flash model',
    icon: Clock,
    badge: 'Stable'
  }
];

export const ModelSelector = () => {
  const { selectedModel, setSelectedModel } = useChatStore();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentModel = models.find(m => m.id === selectedModel) || models[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 transition-colors min-w-[200px]"
      >
        <currentModel.icon className="w-4 h-4 text-primary-neon" />
        <div className="flex-1 text-left">
          <div className="text-sm font-medium">{currentModel.name}</div>
        </div>
        <ChevronDown className={cn("w-4 h-4 text-gray-500 transition-transform", isOpen && "rotate-180")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-full mt-2 left-0 w-72 bg-background-secondary border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden"
          >
            <div className="p-2 space-y-1">
              {models.map((model) => (
                <button
                  key={model.id}
                  onClick={() => {
                    setSelectedModel(model.id);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-start gap-3 p-3 rounded-lg transition-colors text-left",
                    selectedModel === model.id 
                      ? "bg-primary-neon/10 border border-primary-neon/20" 
                      : "hover:bg-white/5"
                  )}
                >
                  <div className={cn(
                    "mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                    selectedModel === model.id ? "bg-primary-neon text-background-primary" : "bg-white/5 text-gray-400"
                  )}>
                    <model.icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={cn("font-medium text-sm", selectedModel === model.id ? "text-primary-neon" : "text-white")}>
                        {model.name}
                      </span>
                      {model.badge && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/10 text-gray-400 border border-white/5">
                          {model.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{model.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
