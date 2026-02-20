/**
 * Express router for image generation endpoints.
 * Handles LoRA-powered image generation via fal.ai FLUX.1-dev.
 */
import { Router } from 'express';
import type { Request, Response } from 'express';
import { generateWithLoRA } from '../services/falGeneration.js';
import type { ApiResponse, GenerationRequest, GenerationResponse, FalImageSize } from '../types/index.js';

const router = Router();

/** Valid image size presets from fal.ai */
const VALID_IMAGE_SIZES: FalImageSize[] = [
    'square_hd', 'square', 'portrait_4_3', 'portrait_16_9',
    'landscape_4_3', 'landscape_16_9',
];

/**
 * POST /api/images/generate
 *
 * Generates images using FLUX.1-dev with optional LoRA style weights.
 *
 * @param req.body.prompt - Text description of the desired image (required)
 * @param req.body.primaryStyleId - Primary trained LoRA job ID (optional)
 * @param req.body.referenceStyleId - Secondary LoRA job ID for blending (optional)
 * @param req.body.imageSize - fal.ai image size preset (default "square_hd")
 * @param req.body.negativePrompt - Elements to avoid (optional)
 * @param req.body.numImages - Number of images 1-4 (default 1)
 * @returns GenerationResponse with image URLs, resolved prompt, and seed
 */
router.post('/generate', async (req: Request, res: Response): Promise<void> => {
    try {
        const body = req.body as Partial<GenerationRequest>;

        // Validate prompt
        if (!body.prompt || typeof body.prompt !== 'string' || body.prompt.trim().length === 0) {
            const response: ApiResponse<never> = { success: false, error: 'prompt is required' };
            res.status(400).json(response);
            return;
        }

        // Validate image size
        const imageSize = body.imageSize || 'square_hd';
        if (!VALID_IMAGE_SIZES.includes(imageSize)) {
            const response: ApiResponse<never> = {
                success: false,
                error: `imageSize must be one of: ${VALID_IMAGE_SIZES.join(', ')}`,
            };
            res.status(400).json(response);
            return;
        }

        // Validate numImages
        const numImages = Math.max(1, Math.min(4, body.numImages || 1));

        const request: GenerationRequest = {
            prompt: body.prompt.trim(),
            primaryStyleId: body.primaryStyleId,
            referenceStyleId: body.referenceStyleId,
            imageSize,
            negativePrompt: body.negativePrompt,
            numImages,
        };

        const result = await generateWithLoRA(request);

        const response: ApiResponse<GenerationResponse> = {
            success: true,
            data: result,
        };
        res.json(response);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Image generation failed';
        const response: ApiResponse<never> = { success: false, error: message };
        res.status(500).json(response);
    }
});

export default router;
