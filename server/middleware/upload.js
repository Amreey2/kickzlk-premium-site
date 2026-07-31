import path from 'node:path';
import { fileURLToPath } from 'node:url';
import multer from 'multer';
import { env } from '../config/env.js';
import AppError from '../utils/AppError.js';

const uploadDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../uploads');
const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

const storage = multer.diskStorage({
  destination: uploadDirectory,
  filename: (request, file, callback) => {
    void request;
    const extension = path.extname(file.originalname).toLowerCase();
    const safeBase = path.basename(file.originalname, extension).replace(/[^a-z0-9-]/gi, '-').slice(0, 60);
    callback(null, `${Date.now()}-${safeBase}${extension}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: env.maxUploadMb * 1024 * 1024, files: 8 },
  fileFilter: (request, file, callback) => {
    void request;
    callback(allowedTypes.has(file.mimetype) ? null : new AppError('Only JPG, PNG, and WebP images are allowed.', 422, 'INVALID_IMAGE_TYPE'), allowedTypes.has(file.mimetype));
  },
});

export const uploadProductImages = upload.array('images', 8);
