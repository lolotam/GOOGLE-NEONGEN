/**
 * fal.ai LoRA training service.
 * Handles image upload to fal.ai storage and LoRA training job submission/polling.
 *
 * Uses the fal-ai/flux-2-trainer endpoint.
 * API Docs: https://fal.ai/models/fal-ai/flux-2-trainer
 */
import { fal } from '@fal-ai/client';
import archiver from 'archiver';
import type { StyleRecord, TrainingStatus, StyleType } from '../types/index.js';
import { TRIGGER_WORD } from '../types/index.js';

/** fal.ai training model endpoint */
const TRAINING_MODEL = 'fal-ai/flux-2-trainer';

/** In-memory store for all style/training records */
const styleRecords = new Map<string, StyleRecord>();

/**
 * Returns the in-memory style records Map.
 * Used by routes to access and manipulate style data.
 * @returns The Map containing all StyleRecord entries
 */
export function getStyleRecords(): Map<string, StyleRecord> {
    return styleRecords;
}

/**
 * Compresses an array of file buffers into a single ZIP archive buffer.
 * The fal.ai trainer expects a zip archive with image files.
 *
 * @param files - Array of objects with buffer and original filename
 * @returns Promise resolving to a ZIP Buffer
 */
async function compressImagesToZip(
    files: Array<{ buffer: Buffer; originalname: string }>
): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        const archive = archiver('zip', { zlib: { level: 6 } });

        archive.on('data', (chunk: Buffer) => chunks.push(chunk));
        archive.on('end', () => resolve(Buffer.concat(chunks)));
        archive.on('error', (err: Error) => reject(err));

        files.forEach((file, index) => {
            const ext = file.originalname.split('.').pop() || 'jpg';
            archive.append(file.buffer, { name: `image_${index}.${ext}` });
        });

        archive.finalize();
    });
}

/**
 * Uploads a ZIP buffer to fal.ai storage and returns the storage URL.
 *
 * @param zipBuffer - The ZIP archive as a Buffer
 * @returns Promise resolving to the fal.ai storage URL
 */
async function uploadZipToFal(zipBuffer: Buffer): Promise<string> {
    const blob = new Blob([zipBuffer], { type: 'application/zip' });
    const file = new File([blob], 'training_images.zip', { type: 'application/zip' });
    const url = await fal.storage.upload(file);
    return url;
}

/**
 * Builds the default_caption for training based on style type.
 * The caption includes the fixed trigger word 'ohwx' so the model
 * learns to associate it with the visual content.
 *
 * @param styleType - The type of style being trained
 * @returns A caption string for the fal.ai training input
 */
function buildDefaultCaption(styleType: StyleType): string {
    switch (styleType) {
        case 'person':
            return `a photo of ${TRIGGER_WORD} person`;
        case 'character':
            return `a photo of ${TRIGGER_WORD} character`;
        case 'art_style':
            return `in the style of ${TRIGGER_WORD}`;
        default:
            return `a photo of ${TRIGGER_WORD}`;
    }
}

/**
 * Maps fal.ai HTTP error codes to user-friendly messages.
 *
 * @param error - The caught error object
 * @returns A descriptive error message
 */
function mapFalError(error: unknown): string {
    if (error instanceof Error) {
        const msg = error.message;
        if (msg.includes('402')) return 'Insufficient fal.ai credits. Please add credits to your account.';
        if (msg.includes('429')) return 'Rate limit exceeded. Please retry in 60 seconds.';
        if (msg.includes('422')) return 'Invalid training data — check image formats (JPEG/PNG/WEBP only).';
        if (msg.includes('timeout') || msg.includes('ETIMEDOUT')) return 'Training service unavailable. Please try again later.';
        return msg;
    }
    return 'Unknown training error';
}

/**
 * Submits a new LoRA training job to fal.ai using flux-2-trainer.
 *
 * Workflow:
 * 1. Compresses images into ZIP
 * 2. Uploads ZIP to fal.ai storage
 * 3. Submits training job via fal.ai queue with default caption
 * 4. Stores the job record in-memory
 * 5. Returns immediately (training continues async on fal.ai)
 *
 * @param styleId - Unique ID for this style record
 * @param styleName - User-defined display name
 * @param styleType - Type of style being trained
 * @param files - Array of uploaded image files from multer
 * @param thumbnail - Optional base64 thumbnail of the first image
 * @returns The created StyleRecord
 */
export async function submitTrainingJob(
    styleId: string,
    styleName: string,
    styleType: StyleType,
    files: Array<{ buffer: Buffer; originalname: string; mimetype: string }>,
    thumbnail?: string
): Promise<StyleRecord> {
    // Create initial record
    const record: StyleRecord = {
        id: styleId,
        styleName,
        styleType,
        triggerWord: TRIGGER_WORD,
        status: 'uploading',
        progress: 0,
        imageCount: files.length,
        thumbnail,
        logs: [],
        createdAt: Date.now(),
    };
    styleRecords.set(styleId, record);

    try {
        // Step 1: Compress images to ZIP
        console.log(`[Training ${styleId}] Step 1: Compressing ${files.length} images...`);
        record.progress = 10;
        record.logs.push('Packaging images into archive...');
        const zipBuffer = await compressImagesToZip(files);
        console.log(`[Training ${styleId}] ZIP ready: ${(zipBuffer.length / 1024 / 1024).toFixed(1)} MB`);

        // Step 2: Upload ZIP to fal.ai storage
        console.log(`[Training ${styleId}] Step 2: Uploading to fal.ai storage...`);
        record.progress = 25;
        record.logs.push('Uploading archive to training servers...');
        const imageDataUrl = await uploadZipToFal(zipBuffer);
        console.log(`[Training ${styleId}] Upload done: ${imageDataUrl}`);

        // Step 3: Submit training job to fal.ai queue
        console.log(`[Training ${styleId}] Step 3: Submitting to fal-ai/flux-2-trainer...`);
        record.status = 'training';
        record.progress = 30;
        record.logs.push('Submitting training job...');

        const defaultCaption = buildDefaultCaption(styleType);
        console.log(`[Training ${styleId}] Caption: "${defaultCaption}"`);

        const { request_id } = await fal.queue.submit(TRAINING_MODEL as string, {
            input: {
                image_data_url: imageDataUrl,
                steps: 1000,
                learning_rate: 0.00005,
                default_caption: defaultCaption,
                output_lora_format: 'fal',
            },
        });

        console.log(`[Training ${styleId}] ✅ Submitted! fal request_id: ${request_id}`);
        record.falRequestId = request_id;
        record.logs.push('Training job accepted — waiting for resources...');
        styleRecords.set(styleId, record);

        return record;
    } catch (error) {
        console.error(`[Training ${styleId}] ❌ FAILED:`, error);
        record.status = 'failed';
        record.errorMessage = mapFalError(error);
        styleRecords.set(styleId, record);
        throw new Error(record.errorMessage);
    }
}

/**
 * Polls fal.ai for the current status of a training job.
 * Updates the in-memory record with progress, logs, and final results.
 *
 * @param styleId - The style record ID to check
 * @returns Object with current status, progress, logs, and optionally loraUrl/triggerWord
 */
export async function pollTrainingStatus(styleId: string): Promise<{
    status: TrainingStatus;
    progress: number;
    logs: string[];
    loraUrl?: string;
    triggerWord?: string;
    errorMessage?: string;
}> {
    const record = styleRecords.get(styleId);
    if (!record) {
        return { status: 'failed', progress: 0, logs: [], errorMessage: 'Style record not found' };
    }

    // Return cached result if terminal state
    if (record.status === 'completed' || record.status === 'failed') {
        return {
            status: record.status,
            progress: record.progress,
            logs: record.logs.slice(-5),
            loraUrl: record.loraUrl,
            triggerWord: record.triggerWord,
            errorMessage: record.errorMessage,
        };
    }

    if (!record.falRequestId) {
        return { status: record.status, progress: record.progress, logs: record.logs.slice(-5) };
    }

    try {
        const statusResult = await fal.queue.status(TRAINING_MODEL as string, {
            requestId: record.falRequestId,
            logs: true,
        });

        // Extract log messages from fal.ai response (untyped for flexibility)
        const rawResult = statusResult as unknown as Record<string, unknown>;
        const falLogs = rawResult.logs as Array<{ message: string }> | undefined;
        if (falLogs && falLogs.length > 0) {
            const newMessages = falLogs.map((l) => l.message);
            record.logs = [...record.logs, ...newMessages];
        }

        const currentStatus = statusResult.status as string;

        if (currentStatus === 'COMPLETED') {
            // Fetch the final result
            const result = await fal.queue.result(TRAINING_MODEL as string, {
                requestId: record.falRequestId,
            });

            // Parse output: { diffusers_lora_file: { url }, config_file: { url } }
            const data = result.data as Record<string, unknown>;
            const diffusersFile = data.diffusers_lora_file as Record<string, string> | undefined;
            const configFile = data.config_file as Record<string, string> | undefined;

            record.status = 'completed';
            record.progress = 100;
            record.loraUrl = diffusersFile?.url || '';
            record.configUrl = configFile?.url || '';
            record.logs.push('Training complete! LoRA weights ready.');
            styleRecords.set(styleId, record);

            return {
                status: 'completed' as TrainingStatus,
                progress: 100,
                logs: record.logs.slice(-5),
                loraUrl: record.loraUrl,
                triggerWord: TRIGGER_WORD,
            };
        } else if (currentStatus === 'FAILED') {
            record.status = 'failed';
            record.errorMessage = 'Training failed on fal.ai';
            record.progress = 0;
            styleRecords.set(styleId, record);

            return {
                status: 'failed' as TrainingStatus,
                progress: 0,
                logs: record.logs.slice(-5),
                errorMessage: record.errorMessage,
            };
        } else {
            // IN_QUEUE or IN_PROGRESS
            if (currentStatus === 'IN_QUEUE') {
                record.status = 'pending';
                record.progress = Math.max(record.progress, 5);
            } else {
                // IN_PROGRESS — estimate progress from log count
                record.status = 'training';
                const logProgress = Math.min(10 + (record.logs.length * 2), 90);
                record.progress = Math.max(record.progress, logProgress);
            }
            styleRecords.set(styleId, record);

            return {
                status: record.status,
                progress: record.progress,
                logs: record.logs.slice(-5),
            };
        }
    } catch (error) {
        const errorMessage = mapFalError(error);
        return {
            status: record.status,
            progress: record.progress,
            logs: record.logs.slice(-5),
            errorMessage,
        };
    }
}
