import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { testDatabaseConnection } from './config/database.js';
import { services as defaultServices } from './config/dependencies.js';
import { env } from './config/env.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import createAdminRoutes from './routes/adminRoutes.js';
import createAuthRoutes from './routes/authRoutes.js';
import createCatalogRoutes from './routes/catalogRoutes.js';
import createOrderRoutes from './routes/orderRoutes.js';
import createProductRoutes from './routes/productRoutes.js';
import createSiteSettingRoutes from './routes/siteSettingRoutes.js';
import createUploadRoutes from './routes/uploadRoutes.js';
import createSeoRoutes from './routes/seoRoutes.js';
import SeoService from './services/SeoService.js';
import AppError from './utils/AppError.js';

const uploads = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'uploads');

export const createApp = ({ services = defaultServices, databaseCheck = testDatabaseConnection } = {}) => {
  const app = express();
  app.disable('x-powered-by');
  if (env.trustProxy !== false) app.set('trust proxy', env.trustProxy);
  app.use((request, response, next) => {
    const suppliedRequestId = request.get('x-request-id');
    request.id = suppliedRequestId && /^[a-z0-9._:-]{1,100}$/i.test(suppliedRequestId)
      ? suppliedRequestId
      : crypto.randomUUID();
    response.set('X-Request-ID', request.id);
    next();
  });
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cors({
    credentials: true,
    origin: (origin, callback) => {
      if (!origin || env.clientOrigins.includes(origin)) return callback(null, true);
      return callback(new AppError('Origin is not allowed by CORS.', 403, 'CORS_ORIGIN_DENIED'));
    },
  }));
  app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 500, standardHeaders: 'draft-8', legacyHeaders: false }));
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: false, limit: '1mb' }));
  app.use(cookieParser());
  app.use('/uploads', express.static(uploads, {
    maxAge: env.nodeEnv === 'production' ? '30d' : 0,
    immutable: env.nodeEnv === 'production',
  }));
  const seoService = services.seoService || new SeoService({
    productService: services.productService,
    catalogService: services.catalogService,
    siteUrl: env.siteUrl,
  });
  app.use(createSeoRoutes(seoService));

  app.get('/api/health', async (request, response) => {
    void request;
    try {
      await databaseCheck();
      response.json({ success: true, data: { service: 'kickz-api', database: 'connected' } });
    } catch (error) {
      response.status(503).json({
        success: false,
        error: { code: 'DATABASE_UNAVAILABLE', message: 'API is running but the database is unavailable.', ...(env.nodeEnv !== 'production' ? { details: error.message } : {}) },
      });
    }
  });
  const privateResponse = (request, response, next) => {
    void request;
    response.set('Cache-Control', 'no-store');
    response.set('Pragma', 'no-cache');
    next();
  };
  app.use('/api/auth', privateResponse, createAuthRoutes(services.authService));
  app.use('/api', createCatalogRoutes(services.catalogService));
  app.use('/api/products', createProductRoutes(services.productService));
  app.use('/api', createSiteSettingRoutes(services.siteSettingService));
  app.use('/api/orders', privateResponse, createOrderRoutes(services.orderService));
  app.use('/api/admin', privateResponse, createAdminRoutes(services));
  app.use('/api/uploads', createUploadRoutes(services.imageService));
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
};

export default createApp();
