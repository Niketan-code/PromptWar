import { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('API Error:', err);
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';

  res.status(status).json({
    data: null,
    meta: {
      source: 'real',
      cached: false,
      timestamp: Date.now(),
    },
    error: message,
  });
}
