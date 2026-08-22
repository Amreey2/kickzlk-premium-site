import AppError from '../utils/AppError.js';

export const notFoundHandler = (request, response, next) => {
  next(new AppError(`Route ${request.method} ${request.originalUrl} was not found.`, 404, 'ROUTE_NOT_FOUND'));
};

export const errorHandler = (error, request, response, next) => {
  void next;
  const status = error.status || (error.code === 'ER_DUP_ENTRY' ? 409 : 500);
  const code = error.code === 'ER_DUP_ENTRY' ? 'DUPLICATE_RECORD' : (error.code || 'INTERNAL_ERROR');
  if (status >= 500) {
    console.error('[server-error]', {
      requestId: request.id,
      method: request.method,
      path: request.originalUrl?.split('?')[0],
      code,
      ...(process.env.NODE_ENV !== 'production' ? { message: error.message, stack: error.stack } : {}),
    });
  }
  response.status(status).json({
    success: false,
    error: {
      code,
      message: status === 500 ? 'An unexpected server error occurred.' : error.message,
      ...(error.details ? { details: error.details } : {}),
      ...(process.env.NODE_ENV !== 'production' && status === 500 ? { debug: error.message } : {}),
      ...(request.id ? { requestId: request.id } : {}),
    },
  });
};
