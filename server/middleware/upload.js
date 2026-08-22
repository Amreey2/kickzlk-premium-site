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

const csvTypes = new Set(['text/csv', 'application/csv', 'application/vnd.ms-excel', 'text/plain', 'application/octet-stream']);
const csvUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (request, file, callback) => {
    void request;
    const valid = path.extname(file.originalname).toLowerCase() === '.csv' && csvTypes.has(file.mimetype);
    callback(valid ? null : new AppError('Upload a valid CSV file.', 422, 'INVALID_CSV_FILE'), valid);
  },
});

export const uploadProductCsv = (request, response, next) => csvUpload.single('file')(request, response, (error) => {
  if (error?.code === 'LIMIT_FILE_SIZE') return next(new AppError('CSV files cannot exceed 5 MB.', 422, 'CSV_FILE_TOO_LARGE'));
  return next(error);
});
