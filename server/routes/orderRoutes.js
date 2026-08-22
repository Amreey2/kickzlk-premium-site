import { Router } from 'express';
import { createOrderController } from '../controllers/orderController.js';
import { optionalCustomer, requireCustomer } from '../middleware/auth.js';
import asyncHandler from '../utils/asyncHandler.js';
import { orderCreateLimit, orderQuoteLimit } from '../middleware/rateLimits.js';

export default function createOrderRoutes(service) {
  const router = Router();
  const controller = createOrderController(service);
  router.post('/quote', orderQuoteLimit, optionalCustomer, asyncHandler(controller.quote));
  router.post('/', orderCreateLimit, optionalCustomer, asyncHandler(controller.create));
  router.get('/user/:userId', requireCustomer, asyncHandler(controller.listForUser));
  router.get('/:id', optionalCustomer, asyncHandler(controller.get));
  return router;
}
