/**
 * Multer middleware configuration for handling multipart image uploads.
 * Stores files in memory (Buffer) for processing and ZIP compression.
 */
import multer from 'multer';
import type { Request } from 'express';

/** Allowed MIME types for training image uploads */
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/** Maximum file size per image: 10MB */
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/** Maximum number of files per upload */
const MAX_FILE_COUNT = 100;

/**
 * File filter that only accepts JPEG, PNG, and WEBP images.
 * Rejects all other file types with a descriptive error message.
 */
function imageFileFilter(
    _req: Request,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback
): void {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`Invalid file type: ${file.mimetype}. Only JPEG, PNG, and WEBP are allowed.`));
    }
}

/**
 * Configured multer instance for training image uploads.
 *
 * Configuration:
 * - Storage: memory (files stored as Buffers)
 * - Max file size: 10MB per file
 * - Max file count: 100 files
 * - Accepted types: JPEG, PNG, WEBP
 */
export const uploadImages = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: MAX_FILE_SIZE,
        files: MAX_FILE_COUNT,
    },
    fileFilter: imageFileFilter,
});
