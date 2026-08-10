import { Router } from 'express';
import { createSiteSettingController } from '../controllers/siteSettingController.js';
import asyncHandler from '../utils/asyncHandler.js';

export default function createSiteSettingRoutes(service) {
  const router = Router();
  const controller = createSiteSettingController(service);
  router.get('/size-guide', asyncHandler(controller.sizeGuide));
  router.get('/payment-settings', asyncHandler(controller.paymentSettings));
  router.get('/homepage-media', asyncHandler(controller.homepageMedia));
  return router;
}
