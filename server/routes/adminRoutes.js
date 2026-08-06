import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { createAuthController } from '../controllers/authController.js';
import { createCatalogController } from '../controllers/catalogController.js';
import { createOrderController } from '../controllers/orderController.js';
import { createProductController } from '../controllers/productController.js';
import { requireAdmin } from '../middleware/auth.js';
import asyncHandler from '../utils/asyncHandler.js';

export default function createAdminRoutes({ authService, orderService, catalogService, productService }) {
  const router = Router();
  const auth = createAuthController(authService);
  const orders = createOrderController(orderService);
  const catalog = createCatalogController(catalogService);
  const products = createProductController(productService);
  const limiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 15, standardHeaders: 'draft-8', legacyHeaders: false });
  router.post('/login', limiter, asyncHandler(auth.adminLogin));
  router.get('/brands', requireAdmin, asyncHandler(catalog.brands));
  router.post('/brands', requireAdmin, asyncHandler(catalog.createBrand));
  router.put('/brands/:id', requireAdmin, asyncHandler(catalog.updateBrand));
  router.delete('/brands/:id', requireAdmin, asyncHandler(catalog.deleteBrand));
  router.get('/categories', requireAdmin, asyncHandler(catalog.categories));
  router.post('/categories', requireAdmin, asyncHandler(catalog.createCategory));
  router.put('/categories/:id', requireAdmin, asyncHandler(catalog.updateCategory));
  router.delete('/categories/:id', requireAdmin, asyncHandler(catalog.deleteCategory));
  router.get('/catalog-options', requireAdmin, asyncHandler(catalog.options));
  router.post('/catalog-options', requireAdmin, asyncHandler(catalog.createOption));
  router.put('/catalog-options/:id', requireAdmin, asyncHandler(catalog.updateOption));
  router.get('/products', requireAdmin, asyncHandler(products.adminList));
  router.get('/products/:id', requireAdmin, asyncHandler(products.adminGet));
  router.get('/orders', requireAdmin, asyncHandler(orders.adminList));
  router.put('/orders/:id/status', requireAdmin, asyncHandler(orders.updateStatus));
  return router;
}
