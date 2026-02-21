/**
 * Frontend API wrapper for fal.ai LoRA training and image generation.
 * All calls go through Supabase Edge Functions and database.
 * The fal.ai API key and Cloudinary secrets are stored as Supabase secrets.
 */
import { supabase } from '@/lib/supabase';
import type { StyleRow } from '@/lib/database.types';

/** Standard API response envelope from edge functions */
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
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

/** Re-export StyleRow for convenience */
export type ServerStyleRecord = StyleRow;

/**
 * Helper: get current session token for edge function auth
 */
async function getAuthToken(): Promise<string> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
        throw new Error('Not authenticated. Please sign in.');
    }
    return session.access_token;
}

/**
 * Submits a LoRA training job with uploaded images.
 * Calls the train-style edge function with auth.
 */
export async function trainLoRA(formData: FormData): Promise<TrainResponse> {
    const token = await getAuthToken();

    const { data, error } = await supabase.functions.invoke('train-style', {
        body: formData,
        headers: { Authorization: `Bearer ${token}` },
    });

    if (error) throw new Error(error.message || 'Training submission failed');

    const response = data as ApiResponse<TrainResponse>;
    if (!response.success || !response.data) {
        throw new Error(response.error || 'Training submission failed');
    }

    return response.data;
}

/**
 * Polls the training status for a given job ID.
 * Uses direct fetch to pass query params to edge function.
 */
export async function pollTrainingStatus(jobId: string): Promise<TrainingStatusResponse> {
    const token = await getAuthToken();
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    const res = await fetch(`${supabaseUrl}/functions/v1/poll-training?jobId=${jobId}`, {
        headers: {
            Authorization: `Bearer ${token}`,
            apikey: anonKey,
        },
    });

    const json = (await res.json()) as ApiResponse<TrainingStatusResponse>;

    if (!json.success || !json.data) {
        throw new Error(json.error || 'Failed to poll training status');
    }

    return json.data;
}

/**
 * Generates images using FLUX.1-dev with optional LoRA styles.
 * Calls the generate-image edge function with auth.
 */
export async function generateWithLoRA(request: GenerateRequest): Promise<GenerateResponse> {
    const token = await getAuthToken();

    const { data, error } = await supabase.functions.invoke('generate-image', {
        body: request,
        headers: { Authorization: `Bearer ${token}` },
    });

    if (error) throw new Error(error.message || 'Image generation failed');

    const response = data as ApiResponse<GenerateResponse>;
    if (!response.success || !response.data) {
        throw new Error(response.error || 'Image generation failed');
    }

    return response.data;
}

/**
 * Fetches all styles for the current user from the Supabase database.
 * RLS ensures only the user's own styles are returned.
 */
export async function listStyles(): Promise<StyleRow[]> {
    const { data, error } = await supabase
        .from('styles')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw new Error(error.message || 'Failed to list styles');
    return data || [];
}

/**
 * Deletes a style record (only the user's own via RLS).
 */
export async function deleteStyle(styleId: string): Promise<void> {
    const { error } = await supabase
        .from('styles')
        .delete()
        .eq('id', styleId);

    if (error) throw new Error(error.message || 'Failed to delete style');
}
