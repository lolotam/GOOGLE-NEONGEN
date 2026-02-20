import { useImageStore } from '@/stores/imageStore';
import { useStyleStore } from '@/stores/styleStore';
import { geminiService } from '@/lib/api/gemini';
import { generateWithLoRA, listStyles } from '@/lib/api/fal';
import type { FalImageSize, ServerStyleRecord } from '@/lib/api/fal';
import {
  Wand2, Image as ImageIcon, Sparkles, AlertCircle,
  Upload, X, Plus, ChevronDown, ChevronUp, Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';

const aspectRatios = [
  { label: '1:1', value: '1:1', falSize: 'square_hd' as FalImageSize },
  { label: '16:9', value: '16:9', falSize: 'landscape_16_9' as FalImageSize },
  { label: '9:16', value: '9:16', falSize: 'portrait_16_9' as FalImageSize },
  { label: '4:3', value: '4:3', falSize: 'landscape_4_3' as FalImageSize },
  { label: '3:4', value: '3:4', falSize: 'portrait_4_3' as FalImageSize },
];

const models = [
  {
    id: 'flux-lora',
    name: 'FLUX.1-dev (LoRA)',
    badge: 'LoRA',
    desc: 'Custom trained styles via fal.ai'
  },
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
  },
];

/** Maps between app aspect ratio values and fal.ai image_size presets */
function getFalImageSize(ratio: string): FalImageSize {
  const match = aspectRatios.find((r) => r.value === ratio);
  return match?.falSize || 'square_hd';
}

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

  // LoRA style selection (for FLUX model)
  const [loraStyles, setLoraStyles] = useState<ServerStyleRecord[]>([]);
  const [primaryStyleId, setPrimaryStyleId] = useState<string | null>(null);
  const [referenceStyleId, setReferenceStyleId] = useState<string | null>(null);
  const [stylesPanelOpen, setStylesPanelOpen] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isFluxModel = selectedModel === 'flux-lora';

  // Fetch available LoRA styles from server when FLUX model is selected
  useEffect(() => {
    if (!isFluxModel) return;

    let cancelled = false;
    const fetchStyles = async () => {
      try {
        const styles = await listStyles();
        if (!cancelled) {
          setLoraStyles(styles.filter((s) => s.status === 'completed'));
        }
      } catch {
        // Silently fail — server might not be running
        if (!cancelled) setLoraStyles([]);
      }
    };

    fetchStyles();
    return () => { cancelled = true; };
  }, [isFluxModel]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setReferenceImage(reader.result as string);
      setSelectedProfileId(null);
    };
    reader.readAsDataURL(file);
  };

  const handleProfileSelect = (id: string) => {
    if (selectedProfileId === id) {
      setSelectedProfileId(null);
    } else {
      setSelectedProfileId(id);
      setReferenceImage(null);
    }
  };

  /**
   * Handles image generation.
   * Routes to either fal.ai FLUX or Gemini based on selected model.
   */
  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;

    setGenerating(true);
    setError(null);

    try {
      if (isFluxModel) {
        // === FLUX.1-dev LoRA Generation ===
        const result = await generateWithLoRA({
          prompt: prompt.trim(),
          primaryStyleId: primaryStyleId || undefined,
          referenceStyleId: referenceStyleId || undefined,
          imageSize: getFalImageSize(aspectRatio),
          numImages: 1,
        });

        result.images.forEach((img) => {
          addImage({
            id: crypto.randomUUID(),
            url: img.url,
            prompt: prompt,
            model: 'FLUX.1-dev (LoRA)',
            aspectRatio: aspectRatio,
            timestamp: Date.now(),
          });
        });
      } else {
        // === Gemini Generation (existing flow) ===
        let finalPrompt = prompt;
        let refImg = referenceImage;

        if (selectedProfileId) {
          const profile = getProfile(selectedProfileId);
          if (profile) {
            finalPrompt = `${prompt}\n\nStyle/Character Context: ${profile.description}`;
            if (profile.referenceImages.length > 0) {
              refImg = profile.referenceImages[0];
            }
          }
        }

        const imageUrl = await geminiService.generateImage(selectedModel, finalPrompt, aspectRatio, refImg);

        addImage({
          id: crypto.randomUUID(),
          url: imageUrl,
          prompt: prompt,
          model: selectedModel,
          aspectRatio: aspectRatio,
          timestamp: Date.now(),
        });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to generate image';
      setError(message);
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

        {/* ═══ FLUX LoRA Style Panel ═══ */}
        {isFluxModel && (
          <div className="space-y-2 mb-6">
            <button
              onClick={() => setStylesPanelOpen(!stylesPanelOpen)}
              className="w-full flex items-center justify-between text-sm font-medium text-gray-400 hover:text-white transition-colors"
            >
              <span className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary-neon" />
                Style Profiles
              </span>
              {stylesPanelOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {stylesPanelOpen && (
              <div className="space-y-3 mt-2 p-3 bg-background-tertiary/50 rounded-xl border border-white/5">
                {/* Primary Style */}
                <div className="space-y-1">
                  <label className="text-xs text-gray-500">Primary Style</label>
                  <select
                    value={primaryStyleId || ''}
                    onChange={(e) => setPrimaryStyleId(e.target.value || null)}
                    className="w-full bg-background-primary border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary-neon/50"
                  >
                    <option value="">None (base model)</option>
                    {loraStyles.map((style) => (
                      <option key={style.id} value={style.id}>
                        {style.styleName} ({style.styleType})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Primary Style Thumbnail Preview */}
                {primaryStyleId && (() => {
                  const style = loraStyles.find((s) => s.id === primaryStyleId);
                  return style?.thumbnail ? (
                    <div className="flex items-center gap-2 p-2 bg-primary-neon/5 rounded-lg border border-primary-neon/10">
                      <img src={style.thumbnail} alt="" className="w-8 h-8 rounded object-cover" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-primary-neon font-medium truncate">{style.styleName}</p>
                        <p className="text-[10px] text-gray-500">Trigger: <code className="text-primary-neon">{style.triggerWord}</code></p>
                      </div>
                    </div>
                  ) : null;
                })()}

                {/* Reference Style (secondary) */}
                <div className="space-y-1">
                  <label className="text-xs text-gray-500">Reference Style (optional)</label>
                  <select
                    value={referenceStyleId || ''}
                    onChange={(e) => setReferenceStyleId(e.target.value || null)}
                    className="w-full bg-background-primary border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary-neon/50"
                  >
                    <option value="">None</option>
                    {loraStyles
                      .filter((s) => s.id !== primaryStyleId)
                      .map((style) => (
                        <option key={style.id} value={style.id}>
                          {style.styleName} ({style.styleType})
                        </option>
                      ))}
                  </select>
                </div>

                {loraStyles.length === 0 && (
                  <div className="text-center py-3">
                    <p className="text-xs text-gray-500 mb-2">No trained styles yet.</p>
                    <Link
                      to="/profiles/create"
                      className="text-xs text-primary-neon hover:underline flex items-center justify-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Train a new style
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ═══ Gemini Style/Character Profiles ═══ */}
        {!isFluxModel && (
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
        )}

        {/* Manual Style Reference (Gemini models only, no profile selected) */}
        {!isFluxModel && !selectedProfileId && (
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
                  <span className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded",
                    model.id === 'flux-lora'
                      ? "bg-purple-500/20 text-purple-400"
                      : "bg-white/10 text-gray-400"
                  )}>
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
