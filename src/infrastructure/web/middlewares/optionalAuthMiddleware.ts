import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { redis } from '../../persistence/redisClient.js';
import { AuthRequest } from './authMiddleware.js';

export const optionalAuthMiddleware = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next();
    }

    const token = authHeader.split(' ')[1];

    try {
        // Check if token is blacklisted in Redis
        const isBlacklisted = await redis.get(`blacklist:${token}`);
        if (isBlacklisted) {
            return next();
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
            id: string;
            email: string;
            role: string;
        };

        req.user = decoded;
        req.token = token;
        return next();
    } catch (error) {
        return next();
    }
};
