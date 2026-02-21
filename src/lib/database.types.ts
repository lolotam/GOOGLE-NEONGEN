/**
 * Database type definitions for Supabase.
 * Matches the styles and gallery tables.
 */
export interface Database {
    public: {
        Tables: {
            styles: {
                Row: {
                    id: string;
                    user_id: string;
                    style_name: string;
                    style_type: 'person' | 'art_style' | 'character';
                    trigger_word: string;
                    status: 'pending' | 'uploading' | 'training' | 'completed' | 'failed';
                    progress: number;
                    lora_url: string | null;
                    config_url: string | null;
                    thumbnail_url: string | null;
                    image_count: number;
                    logs: string[];
                    error_message: string | null;
                    fal_request_id: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    style_name: string;
                    style_type: 'person' | 'art_style' | 'character';
                    trigger_word?: string;
                    status?: string;
                    progress?: number;
                    lora_url?: string | null;
                    config_url?: string | null;
                    thumbnail_url?: string | null;
                    image_count?: number;
                    logs?: string[];
                    error_message?: string | null;
                    fal_request_id?: string | null;
                };
                Update: {
                    style_name?: string;
                    style_type?: string;
                    trigger_word?: string;
                    status?: string;
                    progress?: number;
                    lora_url?: string | null;
                    config_url?: string | null;
                    thumbnail_url?: string | null;
                    image_count?: number;
                    logs?: string[];
                    error_message?: string | null;
                    fal_request_id?: string | null;
                };
            };
            gallery: {
                Row: {
                    id: string;
                    user_id: string;
                    title: string | null;
                    prompt: string | null;
                    image_url: string;
                    thumbnail_url: string | null;
                    width: number | null;
                    height: number | null;
                    model: string | null;
                    style_id: string | null;
                    media_type: 'image' | 'video';
                    cloudinary_public_id: string | null;
                    metadata: Record<string, unknown>;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    title?: string | null;
                    prompt?: string | null;
                    image_url: string;
                    thumbnail_url?: string | null;
                    width?: number | null;
                    height?: number | null;
                    model?: string | null;
                    style_id?: string | null;
                    media_type?: 'image' | 'video';
                    cloudinary_public_id?: string | null;
                    metadata?: Record<string, unknown>;
                };
                Update: {
                    title?: string | null;
                    prompt?: string | null;
                    image_url?: string;
                    thumbnail_url?: string | null;
                    width?: number | null;
                    height?: number | null;
                    model?: string | null;
                    style_id?: string | null;
                    media_type?: 'image' | 'video';
                    cloudinary_public_id?: string | null;
                    metadata?: Record<string, unknown>;
                };
            };
        };
    };
}

export type StyleRow = Database['public']['Tables']['styles']['Row'];
export type StyleInsert = Database['public']['Tables']['styles']['Insert'];
export type StyleUpdate = Database['public']['Tables']['styles']['Update'];
export type GalleryRow = Database['public']['Tables']['gallery']['Row'];
export type GalleryInsert = Database['public']['Tables']['gallery']['Insert'];
export type GalleryUpdate = Database['public']['Tables']['gallery']['Update'];
