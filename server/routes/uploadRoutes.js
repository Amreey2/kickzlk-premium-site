import { Router } from 'express';
import { createUploadController } from '../controllers/uploadController.js';
import { requireAdmin } from '../middleware/auth.js';
import { uploadProductImages } from '../middleware/upload.js';
import asyncHandler from '../utils/asyncHandler.js';

export default function createUploadRoutes(service) {
  const router = Router();
  const controller = createUploadController(service);
  router.post('/products', requireAdmin, uploadProductImages, asyncHandler(controller.productImages));
  return router;
}
