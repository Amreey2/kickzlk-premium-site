import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';

export default function createSeoRoutes(service) {
  const router = Router();
  router.get('/robots.txt', (request, response) => {
    void request;
    response.type('text/plain').set('Cache-Control', 'public, max-age=3600').send(service.robots());
  });
  router.get('/sitemap.xml', asyncHandler(async (request, response) => {
    void request;
    response.type('application/xml').set('Cache-Control', 'public, max-age=900').send(await service.sitemap());
  }));
  return router;
}
