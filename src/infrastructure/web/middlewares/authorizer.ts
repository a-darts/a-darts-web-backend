import { Response, NextFunction } from 'express';
import { AuthRequest } from './authMiddleware.js';
import { ApiResponseBuilder } from '../../../application/dtos/common/ApiResponse.js';
import { UserRoles } from '../../../domain/entities/User.js';
import { prisma } from '../../persistence/prismaClient.js';

export const isSelfOrAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const requestor = req.user;

    if (!requestor) {
        return res.status(401).json(ApiResponseBuilder.error('Unauthorized'));
    }

    const isAdmin = requestor.role === UserRoles.ADMIN;
    if (isAdmin) {
        return next();
    }

    const targetUserId = req.params.id as string | undefined;
    const isOwner = requestor.id === targetUserId;
    if (isOwner) {
        return next();
    }

    // Check by playerId in body (for registration)
    const playerId = req.body?.playerId as string | undefined;
    if (playerId && typeof playerId === 'string') {
        const player = await prisma.player.findFirst({
            where: {
                id: playerId,
                userId: requestor.id
            }
        });
        if (player) {
            return next();
        }
    }

    // Check by participantId in params (for unregistration or check-in)
    const participantId = req.params.participantId as string | undefined;
    if (participantId && typeof participantId === 'string') {
        const participant = await prisma.registeredParticipant.findFirst({
            where: {
                id: participantId,
                player: {
                    userId: requestor.id
                }
            }
        });
        if (participant) {
            return next();
        }
    }

    return res.status(403).json(
        ApiResponseBuilder.error('You do not have permission to perform this action')
    );
};

export const isAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
    const requestor = req.user;

    if (!requestor) {
        return res.status(401).json(
            ApiResponseBuilder.error('Unauthorized')
        );
    }

    const isAdmin = requestor.role === UserRoles.ADMIN;
    if (isAdmin) {
        return next();
    }

    return res.status(403).json(
        ApiResponseBuilder.error('You do not have permission to perform this action')
    );
};
