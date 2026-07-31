import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { createAuthController } from '../controllers/authController.js';
import { createOrderController } from '../controllers/orderController.js';
import { requireAdmin } from '../middleware/auth.js';
import asyncHandler from '../utils/asyncHandler.js';

export default function createAdminRoutes({ authService, orderService }) {
  const router = Router();
  const auth = createAuthController(authService);
  const orders = createOrderController(orderService);
  const limiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 15, standardHeaders: 'draft-8', legacyHeaders: false });
  router.post('/login', limiter, asyncHandler(auth.adminLogin));
  router.get('/orders', requireAdmin, asyncHandler(orders.adminList));
  router.put('/orders/:id/status', requireAdmin, asyncHandler(orders.updateStatus));
  return router;
}
