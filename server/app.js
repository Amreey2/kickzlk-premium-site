import path from 'node:path';
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
import createUploadRoutes from './routes/uploadRoutes.js';

const uploads = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'uploads');

export const createApp = ({ services = defaultServices, databaseCheck = testDatabaseConnection } = {}) => {
  const app = express();
  app.disable('x-powered-by');
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cors({
    credentials: true,
    origin: (origin, callback) => {
      if (!origin || env.clientOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('Origin is not allowed by CORS.'));
    },
  }));
  app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 500, standardHeaders: 'draft-8', legacyHeaders: false }));
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: false, limit: '1mb' }));
  app.use(cookieParser());
  app.use('/uploads', express.static(uploads, { maxAge: env.nodeEnv === 'production' ? '7d' : 0 }));

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
  app.use('/api/auth', createAuthRoutes(services.authService));
  app.use('/api', createCatalogRoutes(services.catalogService));
  app.use('/api/products', createProductRoutes(services.productService));
  app.use('/api/orders', createOrderRoutes(services.orderService));
  app.use('/api/admin', createAdminRoutes(services));
  app.use('/api/uploads', createUploadRoutes(services.imageService));
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
};

export default createApp();
