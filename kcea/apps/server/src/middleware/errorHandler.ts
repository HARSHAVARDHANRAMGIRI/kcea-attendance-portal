import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import pino from 'pino';

const logger = pino();

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export class CustomError extends Error implements AppError {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  error: Error | AppError | ZodError | Prisma.PrismaClientKnownRequestError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let details: any = undefined;

  // Log error with request context
  logger.error({
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack
    },
    request: {
      id: req.requestId,
      method: req.method,
      url: req.url,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      userId: req.user?.id
    }
  }, 'Request error');

  // Handle different error types
  if (error instanceof CustomError) {
    statusCode = error.statusCode;
    message = error.message;
  } else if (error instanceof ZodError) {
    statusCode = 400;
    message = 'Validation Error';
    details = {
      issues: error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
        code: issue.code
      }))
    };
  } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        statusCode = 409;
        message = 'Resource already exists';
        details = {
          field: error.meta?.target,
          constraint: 'unique_violation'
        };
        break;
      case 'P2025':
        statusCode = 404;
        message = 'Resource not found';
        break;
      case 'P2003':
        statusCode = 400;
        message = 'Foreign key constraint failed';
        break;
      case 'P2014':
        statusCode = 400;
        message = 'Invalid relation';
        break;
      default:
        statusCode = 500;
        message = 'Database error';
        break;
    }
  } else if (error instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    message = 'Invalid data provided';
  } else if (error instanceof Prisma.PrismaClientInitializationError) {
    statusCode = 503;
    message = 'Database connection failed';
  } else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  } else if (error.name === 'MulterError') {
    statusCode = 400;
    message = 'File upload error';
    if (error.message.includes('File too large')) {
      message = 'File size too large';
    }
  }

  // Don't expose internal errors in production
  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    message = 'Something went wrong';
    details = undefined;
  }

  // Send error response
  const errorResponse: any = {
    error: getErrorName(statusCode),
    message,
    timestamp: new Date().toISOString(),
    requestId: req.requestId
  };

  if (details) {
    errorResponse.details = details;
  }

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = error.stack;
  }

  res.status(statusCode).json(errorResponse);
};

// Get standard error name from status code
const getErrorName = (statusCode: number): string => {
  switch (statusCode) {
    case 400:
      return 'Bad Request';
    case 401:
      return 'Unauthorized';
    case 403:
      return 'Forbidden';
    case 404:
      return 'Not Found';
    case 409:
      return 'Conflict';
    case 422:
      return 'Unprocessable Entity';
    case 429:
      return 'Too Many Requests';
    case 500:
      return 'Internal Server Error';
    case 502:
      return 'Bad Gateway';
    case 503:
      return 'Service Unavailable';
    default:
      return 'Error';
  }
};

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Create custom errors
export const createError = (message: string, statusCode: number = 500) => {
  return new CustomError(message, statusCode);
};

export const notFound = (resource: string = 'Resource') => {
  return new CustomError(`${resource} not found`, 404);
};

export const unauthorized = (message: string = 'Unauthorized') => {
  return new CustomError(message, 401);
};

export const forbidden = (message: string = 'Forbidden') => {
  return new CustomError(message, 403);
};

export const badRequest = (message: string = 'Bad Request') => {
  return new CustomError(message, 400);
};

export const conflict = (message: string = 'Conflict') => {
  return new CustomError(message, 409);
};
