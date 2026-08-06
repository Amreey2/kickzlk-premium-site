import { Router } from 'express';
import { createCatalogController } from '../controllers/catalogController.js';
import asyncHandler from '../utils/asyncHandler.js';

export default function createCatalogRoutes(service) {
  const router = Router();
  const controller = createCatalogController(service);
  router.get('/brands', asyncHandler(controller.publicBrands));
  router.get('/categories', asyncHandler(controller.publicCategories));
  router.get('/catalog-options', asyncHandler(controller.publicOptions));
  return router;
}
