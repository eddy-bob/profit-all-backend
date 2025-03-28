import { Request, Response, NextFunction } from 'express';

interface IError extends Error {
  statusCode?: number;
}

export const errorHandler = (
  err: IError,
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(err.stack);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });

  // Pass error to next middleware if it's not a handled error
  if (statusCode === 500) {
    next(err);
  }
}; 