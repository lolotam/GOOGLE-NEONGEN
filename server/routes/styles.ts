/**
 * Express router for style training endpoints.
 * Handles LoRA training job submission, status polling, listing, and deletion.
 */
import { Router } from 'express';
import type { Request, Response } from 'express';
import { uploadImages } from '../middleware/upload.js';
import {
    submitTrainingJob,
    pollTrainingStatus,
    getStyleRecords,
} from '../services/falTraining.js';
import type { ApiResponse, StyleRecord, TrainingStatusResponse, StyleType } from '../types/index.js';
import { randomUUID } from 'crypto';

const router = Router();

/** Valid style types for validation */
const VALID_STYLE_TYPES: StyleType[] = ['person', 'art_style', 'character'];

/**
 * POST /api/styles/train
 *
 * Starts a new LoRA training job.
 * Accepts multipart/form-data with images[], styleName, and styleType.
 * Returns a jobId immediately (training continues asynchronously on fal.ai).
 *
 * @param req.files - Array of image files (min 20, max 100)
 * @param req.body.styleName - User-defined name for the style
 * @param req.body.styleType - Type: "person" | "art_style" | "character"
 */
router.post(
    '/train',
    uploadImages.array('images', 100),
    async (req: Request, res: Response): Promise<void> => {
        try {
            const files = req.files as Express.Multer.File[] | undefined;
            const { styleName, styleType } = req.body as { styleName?: string; styleType?: string };

            // Validate styleName
            if (!styleName || typeof styleName !== 'string' || styleName.trim().length === 0) {
                const response: ApiResponse<never> = { success: false, error: 'styleName is required' };
                res.status(400).json(response);
                return;
            }

            // Validate styleType
            if (!styleType || !VALID_STYLE_TYPES.includes(styleType as StyleType)) {
                const response: ApiResponse<never> = {
                    success: false,
                    error: `styleType must be one of: ${VALID_STYLE_TYPES.join(', ')}`,
                };
                res.status(400).json(response);
                return;
            }

            // Validate files — minimum 20, maximum 100
            if (!files || files.length < 20) {
                const response: ApiResponse<never> = {
                    success: false,
                    error: `At least 20 images are required. Received: ${files?.length || 0}`,
                };
                res.status(400).json(response);
                return;
            }

            if (files.length > 100) {
                const response: ApiResponse<never> = {
                    success: false,
                    error: `Maximum 100 images allowed. Received: ${files.length}`,
                };
                res.status(400).json(response);
                return;
            }

            // Generate thumbnail from first image
            const firstFile = files[0];
            const thumbnail = `data:${firstFile.mimetype};base64,${firstFile.buffer.toString('base64')}`;

            // Submit training job (returns immediately)
            const styleId = randomUUID();
            const record = await submitTrainingJob(
                styleId,
                styleName.trim(),
                styleType as StyleType,
                files.map((f) => ({
                    buffer: f.buffer,
                    originalname: f.originalname,
                    mimetype: f.mimetype,
                })),
                thumbnail
            );

            const response: ApiResponse<{ jobId: string; triggerWord: string }> = {
                success: true,
                data: {
                    jobId: record.id,
                    triggerWord: record.triggerWord,
                },
            };
            res.status(202).json(response);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Training submission failed';
            const response: ApiResponse<never> = { success: false, error: message };
            res.status(500).json(response);
        }
    }
);

/**
 * GET /api/styles/train/:jobId/status
 *
 * Polls the training status for a given job.
 * Returns current status, progress, logs, and LoRA URL on completion.
 *
 * @param req.params.jobId - The training job ID
 * @returns TrainingStatusResponse with status, progress, logs, loraUrl, triggerWord
 */
router.get('/train/:jobId/status', async (req: Request, res: Response): Promise<void> => {
    try {
        const { jobId } = req.params;

        if (!jobId) {
            const response: ApiResponse<never> = { success: false, error: 'jobId is required' };
            res.status(400).json(response);
            return;
        }

        const result = await pollTrainingStatus(jobId);

        const response: ApiResponse<TrainingStatusResponse> = {
            success: true,
            data: result,
        };
        res.json(response);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to poll training status';
        const response: ApiResponse<never> = { success: false, error: message };
        res.status(500).json(response);
    }
});

/**
 * GET /api/styles
 *
 * Lists all trained styles with their current status.
 * @returns Array of StyleRecord sorted by creation date (newest first)
 */
router.get('/', (_req: Request, res: Response): void => {
    const records = getStyleRecords();
    const styles = Array.from(records.values()).sort(
        (a, b) => b.createdAt - a.createdAt
    );

    const response: ApiResponse<StyleRecord[]> = {
        success: true,
        data: styles,
    };
    res.json(response);
});

/**
 * DELETE /api/styles/:styleId
 *
 * Deletes a style record from memory.
 * Note: Does not delete the LoRA weights from fal.ai storage.
 *
 * @param req.params.styleId - The style ID to delete
 */
router.delete('/:styleId', (req: Request, res: Response): void => {
    const { styleId } = req.params;
    const records = getStyleRecords();

    if (!records.has(styleId)) {
        const response: ApiResponse<never> = { success: false, error: 'Style not found' };
        res.status(404).json(response);
        return;
    }

    records.delete(styleId);
    const response: ApiResponse<{ deleted: boolean }> = {
        success: true,
        data: { deleted: true },
    };
    res.json(response);
});

export default router;
