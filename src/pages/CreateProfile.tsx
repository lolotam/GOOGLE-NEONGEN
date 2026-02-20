import { useState, useRef } from 'react';
import { useStyleStore } from '@/stores/styleStore';
import { geminiService } from '@/lib/api/gemini';
import { Upload, X, Sparkles, Loader2, Image as ImageIcon, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

export default function CreateProfile() {
  const navigate = useNavigate();
  const { addProfile, setAnalyzing, isAnalyzing, analysisProgress } = useStyleStore();
  
  const [name, setName] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset analysis state on mount to prevent stuck loading screens
  useState(() => {
    setAnalyzing(false, 0);
  });

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    
    // Convert to base64
    const newImages: string[] = [];
    let processed = 0;

    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) return;
      
      const reader = new FileReader();
      reader.onloadend = () => {
        newImages.push(reader.result as string);
        processed++;
        if (processed === files.length) {
          setImages(prev => [...prev, ...newImages]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleAnalyze = async () => {
    if (!name || images.length < 5) return;

    setAnalyzing(true, 0);
    
    try {
      // Simulate "processing" 50-100 images by adding delay and progress steps
      // In a real app, this would upload to a bucket and trigger a batch job
      
      const totalSteps = 10;
      for (let i = 1; i <= totalSteps; i++) {
        await new Promise(resolve => setTimeout(resolve, 800)); // Artificial delay
        setAnalyzing(true, (i / totalSteps) * 80); // Go up to 80%
      }

      // Actual analysis using Gemini
      // Add a timeout promise to prevent hanging indefinitely
      const analysisPromise = geminiService.analyzeStyle(images);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Analysis timed out. Please try fewer images.")), 60000)
      );

      const description = await Promise.race([analysisPromise, timeoutPromise]) as string;
      
      setAnalyzing(true, 100);

      // Store the profile
      // We keep the first 5 images as direct references
      const referenceImages = images.slice(0, 5);
      
      addProfile({
        id: crypto.randomUUID(),
        name,
        description,
        thumbnail: images[0],
        referenceImages,
        createdAt: Date.now()
      });

      // Redirect to Image Gen
      setTimeout(() => {
        setAnalyzing(false, 0);
        navigate('/generate/image');
      }, 1000);

    } catch (error: any) {
      console.error(error);
      setAnalyzing(false, 0);
      alert(`Failed to analyze profile: ${error.message || 'Unknown error'}`);
    }
  };

  return (
    <div className="min-h-screen p-6 lg:p-12 flex flex-col items-center">
      <div className="max-w-3xl w-full">
        <div className="mb-8">
          <h1 className="text-4xl font-display font-bold mb-2">Create Style Profile</h1>
          <p className="text-gray-400">
            Upload 50-100 images to train a custom style profile. 
            We'll analyze the visual patterns to recreate this character or style consistently.
          </p>
        </div>

        {isAnalyzing ? (
          <div className="bg-background-secondary border border-white/10 rounded-3xl p-12 text-center">
            <div className="w-24 h-24 relative mx-auto mb-8">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle
                  className="text-white/10 stroke-current"
                  strokeWidth="8"
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                />
                <circle
                  className="text-primary-neon stroke-current transition-all duration-500 ease-out"
                  strokeWidth="8"
                  strokeLinecap="round"
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  strokeDasharray="251.2"
                  strokeDashoffset={251.2 - (251.2 * analysisProgress) / 100}
                  transform="rotate(-90 50 50)"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-bold font-mono">{Math.round(analysisProgress)}%</span>
              </div>
            </div>
            <h3 className="text-2xl font-bold mb-2">Analyzing Visual Patterns</h3>
            <p className="text-gray-400 animate-pulse">
              Extracting facial features, lighting styles, and artistic nuances...
              <br />
              This may take a few minutes.
            </p>
            <button 
              onClick={() => setAnalyzing(false, 0)}
              className="mt-8 px-6 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors"
            >
              Cancel Analysis
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Name Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Profile Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Cyberpunk Protagonist, Watercolor Style"
                className="w-full bg-background-secondary border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary-neon/50"
              />
            </div>

            {/* Upload Area */}
            <div
              onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "border-2 border-dashed rounded-3xl p-12 text-center cursor-pointer transition-all",
                dragActive 
                  ? "border-primary-neon bg-primary-neon/5" 
                  : "border-white/10 hover:border-white/20 hover:bg-white/5"
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
                <Upload className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">Drop images here</h3>
              <p className="text-gray-400 mb-6">
                or click to browse. Recommended: 50+ images for best results.
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 text-sm text-gray-400">
                <ImageIcon className="w-4 h-4" />
                {images.length} images selected
              </div>
            </div>

            {/* Image Preview Grid */}
            {images.length > 0 && (
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 max-h-[500px] overflow-y-auto p-2 border border-white/5 rounded-xl bg-background-secondary/30">
                {images.map((img, i) => (
                  <div key={i} className="aspect-square rounded-lg overflow-hidden relative group">
                    <img src={img} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => setImages(images.filter((_, idx) => idx !== i))}
                      className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Action Bar */}
            <div className="flex justify-end pt-6 border-t border-white/10">
              <button
                onClick={handleAnalyze}
                disabled={!name || images.length < 5}
                className={cn(
                  "px-8 py-4 rounded-xl font-bold text-lg flex items-center gap-2 transition-all",
                  !name || images.length < 5
                    ? "bg-white/5 text-gray-500 cursor-not-allowed"
                    : "bg-primary-neon text-background-primary hover:bg-primary-lime shadow-lg hover:shadow-primary-neon/20"
                )}
              >
                <Sparkles className="w-5 h-5" />
                Start Analysis
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
