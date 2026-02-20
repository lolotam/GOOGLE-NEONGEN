/**
 * fal.ai image generation service using FLUX.1-dev with optional LoRA weights.
 * Generates images via the fal-ai/flux-lora endpoint.
 *
 * API Docs: https://fal.ai/models/fal-ai/flux-lora
 */
import { fal } from '@fal-ai/client';
import type {
    GenerationRequest,
    GenerationResponse,
    GeneratedImageResult,
    LoraWeight,
} from '../types/index.js';
import { TRIGGER_WORD } from '../types/index.js';
import { getStyleRecords } from './falTraining.js';

/**
 * Generates images using FLUX.1-dev with optional LoRA style weights.
 *
 * Workflow:
 * 1. Looks up LoRA URLs from in-memory style records (if styleId provided)
 * 2. Builds LoRA weights array (single at 0.9 scale, dual at 0.75/0.6)
 * 3. Prepends trigger word 'ohwx' to the user's prompt
 * 4. Calls fal-ai/flux-lora with fal.subscribe (waits for result)
 * 5. Returns generated image URLs
 *
 * @param request - The generation request with prompt, style IDs, and config
 * @returns Promise resolving to GenerationResponse with image URLs
 */
export async function generateWithLoRA(
    request: GenerationRequest
): Promise<GenerationResponse> {
    const styleRecords = getStyleRecords();
    const loras: LoraWeight[] = [];
    let usesTrigger = false;

    // Resolve primary style LoRA
    if (request.primaryStyleId) {
        const primaryStyle = styleRecords.get(request.primaryStyleId);
        if (!primaryStyle) {
            throw new Error(`Primary style '${request.primaryStyleId}' not found`);
        }
        if (primaryStyle.status !== 'completed' || !primaryStyle.loraUrl) {
            throw new Error(`Primary style '${request.primaryStyleId}' training is not completed`);
        }

        const hasDualStyle = !!request.referenceStyleId;
        loras.push({
            path: primaryStyle.loraUrl,
            scale: hasDualStyle ? 0.75 : 0.9,
        });
        usesTrigger = true;
    }

    // Resolve secondary/reference style LoRA
    if (request.referenceStyleId) {
        const refStyle = styleRecords.get(request.referenceStyleId);
        if (!refStyle) {
            throw new Error(`Reference style '${request.referenceStyleId}' not found`);
        }
        if (refStyle.status !== 'completed' || !refStyle.loraUrl) {
            throw new Error(`Reference style '${request.referenceStyleId}' training is not completed`);
        }

        loras.push({
            path: refStyle.loraUrl,
            scale: 0.6,
        });
    }

    // Build final prompt — prepend trigger word if any LoRA is used
    const resolvedPrompt = usesTrigger
        ? `${TRIGGER_WORD}, ${request.prompt}`
        : request.prompt;

    // Build fal.ai request input using string-based image_size
    const falInput: Record<string, unknown> = {
        model_name: 'fal-ai/flux/dev',
        prompt: request.negativePrompt
            ? `${resolvedPrompt}. Avoid: ${request.negativePrompt}`
            : resolvedPrompt,
        image_size: request.imageSize || 'square_hd',
        num_images: Math.max(1, Math.min(4, request.numImages || 1)),
        num_inference_steps: 28,
        guidance_scale: 3.5,
        enable_safety_checker: true,
    };

    // Add LoRA weights if any styles are selected
    if (loras.length > 0) {
        falInput.loras = loras;
    }

    try {
        const result = await fal.subscribe('fal-ai/flux-lora' as string, {
            input: falInput as Record<string, unknown>,
        });

        const data = result.data as Record<string, unknown>;
        const images = (data.images as Array<Record<string, unknown>>) || [];
        const seed = (data.seed as number) || 0;

        const generatedImages: GeneratedImageResult[] = images.map((img) => ({
            url: img.url as string,
            width: (img.width as number) || 1024,
            height: (img.height as number) || 1024,
            contentType: (img.content_type as string) || 'image/png',
        }));

        return {
            images: generatedImages,
            resolvedPrompt,
            seed,
        };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Image generation failed';
        if (message.includes('402')) throw new Error('Insufficient fal.ai credits.');
        if (message.includes('429')) throw new Error('Rate limit exceeded. Retry in 60 seconds.');
        throw new Error(`fal.ai generation error: ${message}`);
    }
}
