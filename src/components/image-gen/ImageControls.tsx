import { useImageStore } from '@/stores/imageStore';
import { useStyleStore } from '@/stores/styleStore';
import { geminiService } from '@/lib/api/gemini';
import { Wand2, Image as ImageIcon, Sparkles, AlertCircle, Upload, X, User, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';

const aspectRatios = [
  { label: '1:1', value: '1:1', icon: 'Square' },
  { label: '16:9', value: '16:9', icon: 'Landscape' },
  { label: '9:16', value: '9:16', icon: 'Portrait' },
  { label: '4:3', value: '4:3', icon: 'Standard' },
  { label: '3:4', value: '3:4', icon: 'Portrait 4:3' },
];

const models = [
  {
    id: 'gemini-3-pro-image-preview',
    name: 'Gemini 3 Pro Image',
    badge: 'High Quality',
    desc: 'Best for detailed, high-res generation'
  },
  {
    id: 'gemini-2.5-flash-image',
    name: 'Gemini 2.5 Flash Image',
    badge: 'Fast',
    desc: 'Quick generation for rapid iteration'
  }
];

export const ImageControls = () => {
  const { 
    prompt, setPrompt, 
    selectedModel, setSelectedModel,
    aspectRatio, setAspectRatio,
    referenceImage, setReferenceImage,
    isGenerating, setGenerating,
    addImage
  } = useImageStore();

  const { profiles, getProfile } = useStyleStore();
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setReferenceImage(reader.result as string);
      setSelectedProfileId(null); // Clear profile if manual image uploaded
    };
    reader.readAsDataURL(file);
  };

  const handleProfileSelect = (id: string) => {
    if (selectedProfileId === id) {
      setSelectedProfileId(null);
    } else {
      setSelectedProfileId(id);
      setReferenceImage(null); // Clear manual image if profile selected
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;
    
    setGenerating(true);
    setError(null);

    try {
      let finalPrompt = prompt;
      let refImg = referenceImage;

      // If a profile is selected, enhance the prompt and use profile references
      if (selectedProfileId) {
        const profile = getProfile(selectedProfileId);
        if (profile) {
          finalPrompt = `${prompt}\n\nStyle/Character Context: ${profile.description}`;
          // Use the first reference image from the profile as the main reference
          // In a more advanced implementation, we might send multiple
          if (profile.referenceImages.length > 0) {
            refImg = profile.referenceImages[0];
          }
        }
      }

      const imageUrl = await geminiService.generateImage(selectedModel, finalPrompt, aspectRatio, refImg);
      
      addImage({
        id: crypto.randomUUID(),
        url: imageUrl,
        prompt: prompt, // Store original prompt for display
        model: selectedModel,
        aspectRatio: aspectRatio,
        timestamp: Date.now()
      });
    } catch (err: any) {
      setError(err.message || "Failed to generate image");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="w-full lg:w-96 h-full border-r border-white/5 bg-background-secondary/50 p-6 flex flex-col gap-8 overflow-y-auto">
      <div>
        <h2 className="text-xl font-display font-bold mb-6 flex items-center gap-2">
          <Wand2 className="w-5 h-5 text-primary-neon" />
          Generate Image
        </h2>

        {/* Prompt */}
        <div className="space-y-2 mb-6">
          <label className="text-sm font-medium text-gray-400">Prompt</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe your image..."
            className="w-full h-32 bg-background-tertiary border border-white/10 rounded-xl p-4 text-sm focus:outline-none focus:border-primary-neon/50 resize-none"
          />
        </div>

        {/* Style/Character Profiles */}
        <div className="space-y-2 mb-6">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-400">Style Profile</label>
            <Link to="/profiles/create" className="text-xs text-primary-neon hover:underline flex items-center gap-1">
              <Plus className="w-3 h-3" /> New Profile
            </Link>
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-2">
            {profiles.map(profile => (
              <button
                key={profile.id}
                onClick={() => handleProfileSelect(profile.id)}
                className={cn(
                  "relative shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all",
                  selectedProfileId === profile.id 
                    ? "border-primary-neon" 
                    : "border-white/10 hover:border-white/30"
                )}
                title={profile.name}
              >
                <img src={profile.thumbnail} alt={profile.name} className="w-full h-full object-cover" />
                {selectedProfileId === profile.id && (
                  <div className="absolute inset-0 bg-primary-neon/20 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white drop-shadow-md" />
                  </div>
                )}
              </button>
            ))}
            {profiles.length === 0 && (
               <div className="text-xs text-gray-500 italic p-2">No profiles created yet.</div>
            )}
          </div>
        </div>

        {/* Manual Style Reference (Only if no profile selected) */}
        {!selectedProfileId && (
          <div className="space-y-2 mb-6">
            <label className="text-sm font-medium text-gray-400 flex items-center justify-between">
              Manual Reference
              {referenceImage && (
                <button 
                  onClick={() => setReferenceImage(null)}
                  className="text-xs text-red-500 hover:text-red-400"
                >
                  Remove
                </button>
              )}
            </label>
            
            {!referenceImage ? (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-24 border border-dashed border-white/20 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-primary-neon/50 hover:bg-white/5 transition-all"
              >
                <Upload className="w-5 h-5 text-gray-500 mb-2" />
                <span className="text-xs text-gray-500">Upload image</span>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  className="hidden" 
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </div>
            ) : (
              <div className="relative w-full h-32 rounded-xl overflow-hidden border border-primary-neon/30 group">
                <img 
                  src={referenceImage} 
                  alt="Reference" 
                  className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-3">
                  <p className="text-xs text-primary-neon font-medium flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Style Active
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

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

        {/* Aspect Ratio */}
        <div className="space-y-2 mb-8">
          <label className="text-sm font-medium text-gray-400">Aspect Ratio</label>
          <div className="grid grid-cols-3 gap-2">
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
              <Sparkles className="w-5 h-5 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <ImageIcon className="w-5 h-5" />
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
