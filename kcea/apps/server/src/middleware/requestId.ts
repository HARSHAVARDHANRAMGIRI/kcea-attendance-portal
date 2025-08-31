import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

export const requestId = (req: Request, res: Response, next: NextFunction) => {
  // Generate or use existing request ID
  const id = req.headers['x-request-id'] as string || uuidv4();
  
  // Attach to request object
  req.requestId = id;
  
  // Set response header
  res.setHeader('X-Request-ID', id);
  
  next();
};
