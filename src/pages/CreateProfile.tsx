import { useState, useRef, useEffect, useCallback } from 'react';
import { useStyleStore } from '@/stores/styleStore';
import { trainLoRA, pollTrainingStatus } from '@/lib/api/fal';
import type { StyleType } from '@/lib/api/fal';
import {
  Upload, X, Sparkles, Image as ImageIcon,
  CheckCircle, ArrowRight, ArrowLeft, User, Palette, Bot, AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

/** Style type option for the type selector */
interface StyleTypeOption {
  id: StyleType;
  label: string;
  description: string;
  icon: typeof User;
}

const STYLE_TYPE_OPTIONS: StyleTypeOption[] = [
  { id: 'person', label: 'Person', description: 'Train on photos of a specific person for consistent face generation', icon: User },
  { id: 'art_style', label: 'Art Style', description: 'Capture an artistic style like watercolor, cyberpunk, or anime', icon: Palette },
  { id: 'character', label: 'Character', description: 'Train on a fictional character for consistent depictions', icon: Bot },
];

const MIN_IMAGES = 20;
const MAX_IMAGES = 100;

/** Training status messages shown during polling */
const STATUS_MESSAGES: Record<string, string[]> = {
  pending: ['Preparing your training data...', 'Setting up the pipeline...'],
  uploading: ['Packaging images into archive...', 'Uploading to training servers...'],
  training: [
    'Training in progress — learning patterns...',
    'Fine-tuning the model on your images...',
    'Almost there — optimizing weights...',
    'Refining details and style consistency...',
  ],
};

export default function CreateProfile() {
  const navigate = useNavigate();
  const { startTraining, updateTrainingStatus } = useStyleStore();

  // Wizard state
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [styleType, setStyleType] = useState<StyleType>('person');
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Training state
  const [jobId, setJobId] = useState<string | null>(null);
  const [trainingStatus, setTrainingStatus] = useState<string>('pending');
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [triggerWord, setTriggerWord] = useState('');
  const [loraUrl, setLoraUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [statusMessageIndex, setStatusMessageIndex] = useState(0);

  /**
   * Handles file selection/drop — adds files up to the MAX_IMAGES limit.
   */
  const handleFiles = useCallback((fileList: FileList | null) => {
    if (!fileList) return;

    const newFiles = Array.from(fileList).filter(
      (f) => f.type.startsWith('image/') && f.size <= 10 * 1024 * 1024
    );

    const totalAllowed = MAX_IMAGES - images.length;
    const filesToAdd = newFiles.slice(0, totalAllowed);

    if (filesToAdd.length === 0) return;

    // Create previews
    filesToAdd.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });

    setImages((prev) => [...prev, ...filesToAdd]);
  }, [images.length]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  /**
   * Submits the training job and transitions to the progress step.
   */
  const handleStartTraining = async () => {
    if (!name.trim() || images.length < MIN_IMAGES) return;

    setError(null);
    setStep(3);

    try {
      const formData = new FormData();
      formData.append('styleName', name.trim());
      formData.append('styleType', styleType);
      images.forEach((file) => formData.append('images', file));

      const result = await trainLoRA(formData);

      setJobId(result.jobId);
      setTriggerWord(result.triggerWord);

      // Create profile in store
      const firstPreview = imagePreviews[0] || '';
      startTraining({
        id: result.jobId,
        name: name.trim(),
        styleType,
        thumbnail: firstPreview,
        createdAt: Date.now(),
        trainingJobId: result.jobId,
        triggerWord: result.triggerWord,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start training';
      setError(message);
      setStep(2); // Go back to upload step
    }
  };

  /**
   * Polls the training status every 5 seconds until completion or failure.
   */
  useEffect(() => {
    if (!jobId || step !== 3) return;

    let cancelled = false;

    const poll = async () => {
      try {
        const result = await pollTrainingStatus(jobId);
        if (cancelled) return;

        setTrainingStatus(result.status);
        setTrainingProgress(result.progress);

        if (result.status === 'completed') {
          setLoraUrl(result.loraUrl || '');
          setTriggerWord(result.triggerWord || triggerWord);
          updateTrainingStatus(
            jobId,
            'completed',
            100,
            result.loraUrl,
            result.triggerWord
          );
          setStep(4);
          return;
        }

        if (result.status === 'failed') {
          setError(result.errorMessage || 'Training failed');
          updateTrainingStatus(jobId, 'failed', 0, undefined, undefined, result.errorMessage);
          return;
        }

        // Continue polling
        setTimeout(poll, 5000);
      } catch (err) {
        if (!cancelled) {
          setTimeout(poll, 10000); // Retry with longer delay on network error
        }
      }
    };

    poll();

    return () => { cancelled = true; };
  }, [jobId, step, triggerWord, updateTrainingStatus]);

  // Cycle through status messages for visual feedback
  useEffect(() => {
    if (step !== 3) return;
    const interval = setInterval(() => {
      setStatusMessageIndex((prev) => prev + 1);
    }, 3000);
    return () => clearInterval(interval);
  }, [step]);

  const currentStatusMessages = STATUS_MESSAGES[trainingStatus] || STATUS_MESSAGES.training;
  const currentMessage = currentStatusMessages[statusMessageIndex % currentStatusMessages.length];

  return (
    <div className="min-h-screen p-6 lg:p-12 flex flex-col items-center">
      <div className="max-w-3xl w-full">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-display font-bold mb-2">Create Style Profile</h1>
          <p className="text-gray-400">
            Train a custom LoRA model to consistently generate images in a specific style or character.
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 mb-10">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all",
                step === s ? "bg-primary-neon text-background-primary" :
                  step > s ? "bg-primary-neon/20 text-primary-neon" :
                    "bg-white/5 text-gray-600"
              )}>
                {step > s ? <CheckCircle className="w-4 h-4" /> : s}
              </div>
              {s < 4 && (
                <div className={cn(
                  "w-12 h-0.5 transition-all",
                  step > s ? "bg-primary-neon/50" : "bg-white/10"
                )} />
              )}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* ═══ STEP 1: Name & Type ═══ */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              {/* Style Name */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Style Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Cyberpunk Hero, Watercolor Style, Luna Character"
                  className="w-full bg-background-secondary border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary-neon/50"
                />
              </div>

              {/* Style Type */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-300">Style Type</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {STYLE_TYPE_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setStyleType(option.id)}
                      className={cn(
                        "p-4 rounded-2xl border text-left transition-all",
                        styleType === option.id
                          ? "bg-primary-neon/10 border-primary-neon/30 shadow-[0_0_15px_rgba(57,255,20,0.1)]"
                          : "bg-background-secondary border-white/5 hover:border-white/20"
                      )}
                    >
                      <option.icon className={cn(
                        "w-6 h-6 mb-3",
                        styleType === option.id ? "text-primary-neon" : "text-gray-400"
                      )} />
                      <h3 className={cn(
                        "font-bold text-sm mb-1",
                        styleType === option.id ? "text-primary-neon" : "text-white"
                      )}>
                        {option.label}
                      </h3>
                      <p className="text-xs text-gray-500 leading-relaxed">{option.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Next Button */}
              <div className="flex justify-end pt-6 border-t border-white/10">
                <button
                  onClick={() => setStep(2)}
                  disabled={!name.trim()}
                  className={cn(
                    "px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all",
                    !name.trim()
                      ? "bg-white/5 text-gray-500 cursor-not-allowed"
                      : "bg-primary-neon text-background-primary hover:bg-primary-lime"
                  )}
                >
                  Next <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* ═══ STEP 2: Image Upload ═══ */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Upload Zone */}
              <div
                onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "border-2 border-dashed rounded-3xl p-10 text-center cursor-pointer transition-all",
                  dragActive
                    ? "border-primary-neon bg-primary-neon/5"
                    : "border-white/10 hover:border-white/20 hover:bg-white/5"
                )}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => handleFiles(e.target.files)}
                />
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
                  <Upload className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold mb-2">Drop images here</h3>
                <p className="text-gray-400 mb-4">or click to browse. JPEG, PNG, or WEBP — max 10MB each.</p>

                {/* Count Badge */}
                <div className={cn(
                  "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium",
                  images.length >= MIN_IMAGES
                    ? "bg-primary-neon/10 text-primary-neon border border-primary-neon/20"
                    : "bg-white/5 text-gray-400"
                )}>
                  <ImageIcon className="w-4 h-4" />
                  {images.length} / {MAX_IMAGES} images
                  {images.length < MIN_IMAGES && (
                    <span className="text-xs text-yellow-500">
                      (min {MIN_IMAGES} required)
                    </span>
                  )}
                </div>
              </div>

              {/* Image Preview Grid */}
              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2 max-h-[400px] overflow-y-auto p-2 border border-white/5 rounded-xl bg-background-secondary/30">
                  {imagePreviews.map((preview, i) => (
                    <div key={i} className="aspect-square rounded-lg overflow-hidden relative group">
                      <img src={preview} alt="" className="w-full h-full object-cover" />
                      <button
                        onClick={(e) => { e.stopPropagation(); removeImage(i); }}
                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Navigation */}
              <div className="flex justify-between pt-6 border-t border-white/10">
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-3 rounded-xl bg-white/5 text-white font-medium hover:bg-white/10 transition-colors flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  onClick={handleStartTraining}
                  disabled={images.length < MIN_IMAGES}
                  className={cn(
                    "px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all",
                    images.length < MIN_IMAGES
                      ? "bg-white/5 text-gray-500 cursor-not-allowed"
                      : "bg-primary-neon text-background-primary hover:bg-primary-lime shadow-lg hover:shadow-primary-neon/20"
                  )}
                >
                  <Sparkles className="w-5 h-5" />
                  Start Training
                </button>
              </div>
            </motion.div>
          )}

          {/* ═══ STEP 3: Training Progress ═══ */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-background-secondary border border-white/10 rounded-3xl p-12 text-center"
            >
              {/* Progress Ring */}
              <div className="w-28 h-28 relative mx-auto mb-8">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle
                    className="text-white/10 stroke-current"
                    strokeWidth="6"
                    cx="50" cy="50" r="42"
                    fill="transparent"
                  />
                  <circle
                    className="text-primary-neon stroke-current transition-all duration-700 ease-out"
                    strokeWidth="6"
                    strokeLinecap="round"
                    cx="50" cy="50" r="42"
                    fill="transparent"
                    strokeDasharray="263.9"
                    strokeDashoffset={263.9 - (263.9 * trainingProgress) / 100}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold font-mono">{Math.round(trainingProgress)}%</span>
                </div>
              </div>

              <h3 className="text-2xl font-bold mb-3">Training Your Model</h3>
              <p className="text-gray-400 animate-pulse mb-2">
                {currentMessage}
              </p>
              <p className="text-xs text-gray-600">
                This may take 5–15 minutes depending on the number of images.
              </p>

              {error && (
                <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2 justify-center">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}
            </motion.div>
          )}

          {/* ═══ STEP 4: Success ═══ */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-background-secondary border border-primary-neon/20 rounded-3xl p-10 text-center"
            >
              <div className="w-20 h-20 rounded-full bg-primary-neon/20 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-primary-neon" />
              </div>

              <h3 className="text-3xl font-display font-bold mb-2">Training Complete!</h3>
              <p className="text-gray-400 mb-8">
                Your LoRA model <span className="text-primary-neon font-mono">{name}</span> is ready to use.
              </p>

              {/* Trigger Word */}
              <div className="inline-flex items-center gap-3 px-6 py-3 bg-background-tertiary rounded-xl border border-white/10 mb-8">
                <span className="text-sm text-gray-400">Trigger Word:</span>
                <code className="text-primary-neon font-mono font-bold">{triggerWord}</code>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => navigate('/generate/image')}
                  className="px-8 py-3 rounded-xl bg-primary-neon text-background-primary font-bold hover:bg-primary-lime transition-colors flex items-center justify-center gap-2"
                >
                  <ImageIcon className="w-5 h-5" />
                  Generate Images
                </button>
                <button
                  onClick={() => {
                    setStep(1);
                    setName('');
                    setImages([]);
                    setImagePreviews([]);
                    setJobId(null);
                    setTrainingProgress(0);
                    setError(null);
                  }}
                  className="px-8 py-3 rounded-xl bg-white/5 text-white font-medium hover:bg-white/10 transition-colors"
                >
                  Train Another
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
