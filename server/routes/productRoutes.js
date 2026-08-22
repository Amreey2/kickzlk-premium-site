import { Router } from 'express';
import { createProductController } from '../controllers/productController.js';
import { requireAdmin } from '../middleware/auth.js';
import asyncHandler from '../utils/asyncHandler.js';
import { catalogReadLimit } from '../middleware/rateLimits.js';

export default function createProductRoutes(service) {
  const router = Router();
  const controller = createProductController(service);
  router.get('/', catalogReadLimit, asyncHandler(controller.list));
  router.get('/:id', catalogReadLimit, asyncHandler(controller.get));
  router.post('/', requireAdmin, asyncHandler(controller.create));
  router.put('/:id', requireAdmin, asyncHandler(controller.update));
  router.delete('/:id', requireAdmin, asyncHandler(controller.delete));
  return router;
}
