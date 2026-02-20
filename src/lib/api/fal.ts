/**
 * Frontend API wrapper for fal.ai LoRA training and image generation.
 * All calls are proxied through the Express backend at /api.
 * The fal.ai API key never reaches the browser.
 */

/** Standard API response envelope from backend */
export interface ApiResponse<T> {
    /** Whether the request succeeded */
    success: boolean;
    /** Response payload (present on success) */
    data?: T;
    /** Error message (present on failure) */
    error?: string;
}

/** Style type for training */
export type StyleType = 'person' | 'art_style' | 'character';

/** Training status lifecycle */
export type TrainingStatus = 'pending' | 'uploading' | 'training' | 'completed' | 'failed';

/** fal.ai image size presets */
export type FalImageSize =
    | 'square_hd'
    | 'square'
    | 'portrait_4_3'
    | 'portrait_16_9'
    | 'landscape_4_3'
    | 'landscape_16_9';

/** Style record returned from the server */
export interface ServerStyleRecord {
    id: string;
    styleName: string;
    styleType: StyleType;
    triggerWord: string;
    status: TrainingStatus;
    progress: number;
    loraUrl?: string;
    configUrl?: string;
    thumbnail?: string;
    imageCount: number;
    logs: string[];
    createdAt: number;
    errorMessage?: string;
}

/** Response from training submission */
export interface TrainResponse {
    jobId: string;
    triggerWord: string;
}

/** Training status poll response */
export interface TrainingStatusResponse {
    status: TrainingStatus;
    progress: number;
    logs: string[];
    loraUrl?: string;
    triggerWord?: string;
    errorMessage?: string;
}

/** Image generation request */
export interface GenerateRequest {
    prompt: string;
    primaryStyleId?: string;
    referenceStyleId?: string;
    imageSize: FalImageSize;
    negativePrompt?: string;
    numImages: number;
}

/** Single generated image from fal.ai */
export interface GeneratedFalImage {
    url: string;
    width: number;
    height: number;
    contentType: string;
}

/** Image generation response */
export interface GenerateResponse {
    images: GeneratedFalImage[];
    resolvedPrompt: string;
    seed: number;
}

/**
 * Submits a LoRA training job with uploaded images.
 *
 * @param formData - FormData with images[], styleName, and styleType
 * @returns Promise with jobId and triggerWord ('ohwx')
 */
export async function trainLoRA(formData: FormData): Promise<TrainResponse> {
    const res = await fetch('/api/styles/train', {
        method: 'POST',
        body: formData,
    });

    const json = (await res.json()) as ApiResponse<TrainResponse>;

    if (!json.success || !json.data) {
        throw new Error(json.error || 'Training submission failed');
    }

    return json.data;
}

/**
 * Polls the training status for a given job ID.
 * Returns status, progress, logs, and optionally loraUrl/triggerWord on completion.
 *
 * @param jobId - The training job ID returned from trainLoRA
 * @returns Current training status with progress, logs, and optional LoRA URL
 */
export async function pollTrainingStatus(jobId: string): Promise<TrainingStatusResponse> {
    const res = await fetch(`/api/styles/train/${jobId}/status`);
    const json = (await res.json()) as ApiResponse<TrainingStatusResponse>;

    if (!json.success || !json.data) {
        throw new Error(json.error || 'Failed to poll training status');
    }

    return json.data;
}

/**
 * Generates images using FLUX.1-dev with optional LoRA styles.
 *
 * @param request - Generation request with prompt, style IDs, and settings
 * @returns Generated image URLs and metadata
 */
export async function generateWithLoRA(request: GenerateRequest): Promise<GenerateResponse> {
    const res = await fetch('/api/images/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
    });

    const json = (await res.json()) as ApiResponse<GenerateResponse>;

    if (!json.success || !json.data) {
        throw new Error(json.error || 'Image generation failed');
    }

    return json.data;
}

/**
 * Fetches all trained styles from the server.
 *
 * @returns Array of ServerStyleRecord sorted by creation date (newest first)
 */
export async function listStyles(): Promise<ServerStyleRecord[]> {
    const res = await fetch('/api/styles');
    const json = (await res.json()) as ApiResponse<ServerStyleRecord[]>;

    if (!json.success || !json.data) {
        throw new Error(json.error || 'Failed to list styles');
    }

    return json.data;
}

/**
 * Deletes a style record from the server.
 *
 * @param styleId - The style ID to delete
 */
export async function deleteStyle(styleId: string): Promise<void> {
    const res = await fetch(`/api/styles/${styleId}`, { method: 'DELETE' });
    const json = (await res.json()) as ApiResponse<{ deleted: boolean }>;

    if (!json.success) {
        throw new Error(json.error || 'Failed to delete style');
    }
}
