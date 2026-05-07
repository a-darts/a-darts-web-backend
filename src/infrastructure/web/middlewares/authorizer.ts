// src/infrastructure/http/middlewares/authorizer.ts
import { Response, NextFunction } from 'express';
import { AuthRequest } from './authMiddleware.js';
import { ApiResponseBuilder } from '../../../application/dtos/common/ApiResponse.js';
import { UserRoles } from '../../../domain/entities/User.js';

export const isSelfOrAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
    const requestor = req.user;
    const targetUserId = req.params.id;

    if (!requestor) {
        return res.status(401).json(ApiResponseBuilder.error('Unauthorized'));
    }

    const isOwner = requestor.id === targetUserId;
    const isAdmin = requestor.role === UserRoles.ADMIN;

    if (isOwner || isAdmin) {
        return next();
    }

    return res.status(403).json(
        ApiResponseBuilder.error('You do not have permission to perform this action')
    );
};
