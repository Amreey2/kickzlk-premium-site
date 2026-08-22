import rateLimit from 'express-rate-limit';

export const createRateLimit = ({ limit, code, message }) => rateLimit({
  windowMs: 15 * 60 * 1000,
  limit,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (request, response) => {
    void request;
    response.status(429).json({ success: false, error: { code, message } });
  },
});

export const catalogReadLimit = createRateLimit({
  limit: 240,
  code: 'CATALOG_RATE_LIMITED',
  message: 'Too many catalogue requests. Please try again shortly.',
});

export const orderQuoteLimit = createRateLimit({
  limit: 120,
  code: 'QUOTE_RATE_LIMITED',
  message: 'Too many pricing requests. Please try again shortly.',
});

export const orderCreateLimit = createRateLimit({
  limit: 20,
  code: 'ORDER_RATE_LIMITED',
  message: 'Too many order attempts. Please wait before trying again.',
});
