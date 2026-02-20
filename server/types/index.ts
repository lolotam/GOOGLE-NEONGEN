/**
 * Shared TypeScript interfaces for the NeonGen backend server.
 * These types are used across routes, services, and middleware.
 */

/** Supported style types for LoRA training */
export type StyleType = 'person' | 'art_style' | 'character';

/** Training job status lifecycle */
export type TrainingStatus = 'pending' | 'uploading' | 'training' | 'completed' | 'failed';

/**
 * The fixed trigger word used by fal-ai/flux-2-trainer.
 * Must be prepended to prompts when generating with a trained LoRA.
 */
export const TRIGGER_WORD = 'ohwx';

/**
 * A trained style record stored in-memory on the server.
 * Represents a LoRA model that was trained via fal.ai flux-2-trainer.
 */
export interface StyleRecord {
  /** Unique identifier for this style / job */
  id: string;
  /** User-defined display name */
  styleName: string;
  /** Type of training (person, art style, or character) */
  styleType: StyleType;
  /** Trigger word — always 'ohwx' for flux-2-trainer */
  triggerWord: string;
  /** Current training status */
  status: TrainingStatus;
  /** Training progress 0-100 */
  progress: number;
  /** fal.ai queue request ID for polling */
  falRequestId?: string;
  /** URL of the trained LoRA weights file (available on completion) */
  loraUrl?: string;
  /** URL of the config file (available on completion) */
  configUrl?: string;
  /** Thumbnail from first uploaded image (base64 data URI) */
  thumbnail?: string;
  /** Number of training images uploaded */
  imageCount: number;
  /** Recent training log messages from fal.ai */
  logs: string[];
  /** Unix timestamp of creation */
  createdAt: number;
  /** Error message if training failed */
  errorMessage?: string;
}

/**
 * Request body for POST /api/images/generate
 */
export interface GenerationRequest {
  /** Text prompt describing the desired image */
  prompt: string;
  /** Optional job ID referencing a trained LoRA (primary) */
  primaryStyleId?: string;
  /** Optional second job ID for style blending */
  referenceStyleId?: string;
  /** Image size preset (fal.ai enum) */
  imageSize: FalImageSize;
  /** Negative prompt to exclude elements */
  negativePrompt?: string;
  /** Number of images to generate (1-4) */
  numImages: number;
}

/** fal.ai image size presets for flux-lora generation */
export type FalImageSize =
  | 'square_hd'
  | 'square'
  | 'portrait_4_3'
  | 'portrait_16_9'
  | 'landscape_4_3'
  | 'landscape_16_9';

/**
 * Single generated image result from fal.ai
 */
export interface GeneratedImageResult {
  /** URL of the generated image hosted on fal.ai CDN */
  url: string;
  /** Width in pixels */
  width: number;
  /** Height in pixels */
  height: number;
  /** Content type */
  contentType: string;
}

/**
 * Response from POST /api/images/generate
 */
export interface GenerationResponse {
  /** Array of generated image results */
  images: GeneratedImageResult[];
  /** The final prompt sent to fal.ai (with trigger words prepended) */
  resolvedPrompt: string;
  /** Seed used for generation */
  seed: number;
}

/**
 * Response from GET /api/styles/train/:jobId/status
 */
export interface TrainingStatusResponse {
  /** Current job status */
  status: TrainingStatus;
  /** Progress percentage 0-100 */
  progress: number;
  /** Recent log messages from training */
  logs: string[];
  /** LoRA weights URL (only when completed) */
  loraUrl?: string;
  /** Trigger word (only when completed) */
  triggerWord?: string;
  /** Error message (only when failed) */
  errorMessage?: string;
}

/**
 * Standard API response envelope used for all endpoints.
 * @template T The type of the data payload
 */
export interface ApiResponse<T> {
  /** Whether the request succeeded */
  success: boolean;
  /** Response payload (present on success) */
  data?: T;
  /** Error message (present on failure) */
  error?: string;
}

/**
 * fal.ai LoRA weight specification for generation
 */
export interface LoraWeight {
  /** URL path to the LoRA weights */
  path: string;
  /** Scale factor for the LoRA influence (0-1) */
  scale: number;
}
