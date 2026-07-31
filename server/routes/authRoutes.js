import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { createAuthController } from '../controllers/authController.js';
import { requireCustomer } from '../middleware/auth.js';
import asyncHandler from '../utils/asyncHandler.js';

export default function createAuthRoutes(service) {
  const router = Router();
  const controller = createAuthController(service);
  const limiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: 'draft-8', legacyHeaders: false });
  router.post('/register', limiter, asyncHandler(controller.register));
  router.post('/login', limiter, asyncHandler(controller.login));
  router.get('/profile', requireCustomer, asyncHandler(controller.profile));
  return router;
}
