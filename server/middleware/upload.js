import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import multer from 'multer';
import { env } from '../config/env.js';
import AppError from '../utils/AppError.js';

const uploadDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../uploads');
const allowedTypes = new Map([
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['image/webp', '.webp'],
]);

const storage = multer.diskStorage({
  destination: uploadDirectory,
  filename: (request, file, callback) => {
    void request;
    const originalExtension = path.extname(file.originalname).toLowerCase();
    const safeBase = path.basename(file.originalname, originalExtension).replace(/[^a-z0-9-]/gi, '-').slice(0, 60) || 'image';
    callback(null, `${Date.now()}-${crypto.randomUUID()}-${safeBase}${allowedTypes.get(file.mimetype)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: env.maxUploadMb * 1024 * 1024, files: 8 },
  fileFilter: (request, file, callback) => {
    void request;
    const valid = allowedTypes.has(file.mimetype);
    callback(valid ? null : new AppError('Only JPG, PNG, and WebP images are allowed.', 422, 'INVALID_IMAGE_TYPE'), valid);
  },
});

const matchesImageSignature = async (file) => {
  const handle = await fs.open(file.path, 'r');
  try {
    const header = Buffer.alloc(12);
    const { bytesRead } = await handle.read(header, 0, header.length, 0);
    if (file.mimetype === 'image/jpeg') return bytesRead >= 3 && header.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]));
    if (file.mimetype === 'image/png') return bytesRead >= 8 && header.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    if (file.mimetype === 'image/webp') return bytesRead >= 12 && header.subarray(0, 4).toString() === 'RIFF' && header.subarray(8, 12).toString() === 'WEBP';
    return false;
  } finally {
    await handle.close();
  }
};

const cleanupFiles = async (files = []) => Promise.all(files.map((file) => fs.unlink(file.path).catch(() => undefined)));
const imageUpload = upload.array('images', 8);

export const uploadProductImages = (request, response, next) => imageUpload(request, response, async (error) => {
  if (error) {
    await cleanupFiles(request.files);
    if (error.code === 'LIMIT_FILE_SIZE') return next(new AppError(`Images cannot exceed ${env.maxUploadMb} MB.`, 422, 'IMAGE_FILE_TOO_LARGE'));
    if (error.code === 'LIMIT_FILE_COUNT' || error.code === 'LIMIT_UNEXPECTED_FILE') return next(new AppError('Upload a maximum of 8 images.', 422, 'TOO_MANY_IMAGES'));
    return next(error);
  }
  try {
    const validity = await Promise.all((request.files || []).map(matchesImageSignature));
    if (validity.some((valid) => !valid)) {
      await cleanupFiles(request.files);
      request.files = [];
      return next(new AppError('One or more files do not contain valid JPG, PNG, or WebP image data.', 422, 'INVALID_IMAGE_CONTENT'));
    }
    return next();
  } catch (validationError) {
    await cleanupFiles(request.files);
    request.files = [];
    return next(validationError);
  }
});

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
