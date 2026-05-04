import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { redis } from '../../redis/redisClient.js';
import { ApiResponseBuilder } from '../../../application/dtos/common/ApiResponse.js';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
  token?: string;
}

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json(
      ApiResponseBuilder.error('No token provided')
    );
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    // Check if token is blacklisted in Redis
    const isBlacklisted = await redis.get(`blacklist:${token}`);
    if (isBlacklisted) {
      res.status(401).json(
        ApiResponseBuilder.error('Token has been invalidated')
      );
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      id: string;
      email: string;
      role: string;
    };

    req.user = decoded;
    req.token = token;
    next();
  } catch (error) {
    res.status(401).json(
      ApiResponseBuilder.error('Invalid token')
    );
  }
};
