import { useVideoStore } from '@/stores/videoStore';
import { geminiService } from '@/lib/api/gemini';
import { Video, Film, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const aspectRatios = [
  { label: '16:9', value: '16:9', icon: 'Landscape' },
  { label: '9:16', value: '9:16', icon: 'Portrait' },
];

const resolutions = [
    { label: '720p', value: '720p' },
    { label: '1080p', value: '1080p' }
];

const models = [
  {
    id: 'veo-3.1-fast-generate-preview',
    name: 'Veo 3.1 Fast',
    badge: 'Fast',
    desc: 'Quick generation, max 8s'
  },
  {
    id: 'veo-3.1-generate-preview',
    name: 'Veo 3.1',
    badge: 'High Quality',
    desc: 'Higher quality generation'
  }
];

export const VideoControls = () => {
  const { 
    prompt, setPrompt, 
    selectedModel, setSelectedModel,
    aspectRatio, setAspectRatio,
    resolution, setResolution,
    isGenerating, setGenerating,
    addVideo, setGenerationStatus
  } = useVideoStore();

  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;
    
    setGenerating(true);
    setGenerationStatus('Initializing...');
    setError(null);

    try {
      const operation = await geminiService.generateVideo(selectedModel, prompt, { aspectRatio, resolution });
      
      setGenerationStatus('Processing video... (this may take a minute)');
      const videoUrl = await geminiService.pollVideoOperation(operation);
      
      addVideo({
        id: crypto.randomUUID(),
        url: videoUrl,
        prompt: prompt,
        model: selectedModel,
        aspectRatio: aspectRatio,
        duration: 'Generated',
        timestamp: Date.now()
      });
      
      setGenerationStatus('Complete!');
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to generate video");
      setGenerationStatus('Failed');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="w-full lg:w-96 h-full border-r border-white/5 bg-background-secondary/50 p-6 flex flex-col gap-8 overflow-y-auto">
      <div>
        <h2 className="text-xl font-display font-bold mb-6 flex items-center gap-2">
          <Film className="w-5 h-5 text-primary-neon" />
          Generate Video
        </h2>

        {/* Prompt */}
        <div className="space-y-2 mb-6">
          <label className="text-sm font-medium text-gray-400">Prompt</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe your video scene..."
            className="w-full h-32 bg-background-tertiary border border-white/10 rounded-xl p-4 text-sm focus:outline-none focus:border-primary-neon/50 resize-none"
          />
        </div>

        {/* Model Selection */}
        <div className="space-y-2 mb-6">
          <label className="text-sm font-medium text-gray-400">Model</label>
          <div className="space-y-2">
            {models.map((model) => (
              <button
                key={model.id}
                onClick={() => setSelectedModel(model.id)}
                className={cn(
                  "w-full text-left p-3 rounded-xl border transition-all",
                  selectedModel === model.id
                    ? "bg-primary-neon/10 border-primary-neon/30"
                    : "bg-background-tertiary border-white/5 hover:bg-white/5"
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={cn("font-medium text-sm", selectedModel === model.id ? "text-primary-neon" : "text-white")}>
                    {model.name}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-gray-400">
                    {model.badge}
                  </span>
                </div>
                <p className="text-xs text-gray-500">{model.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Settings Grid */}
        <div className="grid grid-cols-2 gap-4 mb-8">
            {/* Aspect Ratio */}
            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">Aspect Ratio</label>
                <div className="flex flex-col gap-2">
                    {aspectRatios.map((ratio) => (
                    <button
                        key={ratio.value}
                        onClick={() => setAspectRatio(ratio.value)}
                        className={cn(
                        "p-2 rounded-lg text-xs font-medium border transition-colors",
                        aspectRatio === ratio.value
                            ? "bg-primary-neon/10 border-primary-neon/30 text-primary-neon"
                            : "bg-background-tertiary border-white/5 text-gray-400 hover:bg-white/5"
                        )}
                    >
                        {ratio.label}
                    </button>
                    ))}
                </div>
            </div>

            {/* Resolution */}
            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">Resolution</label>
                <div className="flex flex-col gap-2">
                    {resolutions.map((res) => (
                    <button
                        key={res.value}
                        onClick={() => setResolution(res.value)}
                        className={cn(
                        "p-2 rounded-lg text-xs font-medium border transition-colors",
                        resolution === res.value
                            ? "bg-primary-neon/10 border-primary-neon/30 text-primary-neon"
                            : "bg-background-tertiary border-white/5 text-gray-400 hover:bg-white/5"
                        )}
                    >
                        {res.label}
                    </button>
                    ))}
                </div>
            </div>
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={!prompt.trim() || isGenerating}
          className={cn(
            "w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all",
            !prompt.trim() || isGenerating
              ? "bg-white/5 text-gray-500 cursor-not-allowed"
              : "bg-primary-neon text-background-primary hover:bg-primary-lime shadow-[0_0_20px_rgba(57,255,20,0.3)] hover:shadow-[0_0_30px_rgba(57,255,20,0.5)]"
          )}
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Video className="w-5 h-5" />
              Generate
            </>
          )}
        </button>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            {error}
          </div>
        )}
      </div>
    </div>
  );
};
