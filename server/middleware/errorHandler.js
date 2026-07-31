import AppError from '../utils/AppError.js';

export const notFoundHandler = (request, response, next) => {
  next(new AppError(`Route ${request.method} ${request.originalUrl} was not found.`, 404, 'ROUTE_NOT_FOUND'));
};

export const errorHandler = (error, request, response, next) => {
  void request;
  void next;
  const status = error.status || (error.code === 'ER_DUP_ENTRY' ? 409 : 500);
  const code = error.code === 'ER_DUP_ENTRY' ? 'DUPLICATE_RECORD' : (error.code || 'INTERNAL_ERROR');
  response.status(status).json({
    success: false,
    error: {
      code,
      message: status === 500 ? 'An unexpected server error occurred.' : error.message,
      ...(error.details ? { details: error.details } : {}),
      ...(process.env.NODE_ENV !== 'production' && status === 500 ? { debug: error.message } : {}),
    },
  });
};
