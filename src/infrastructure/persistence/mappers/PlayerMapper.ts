import { Player as PrismaPlayer, PlayerStatus as PrismaPlayerStatus } from '@prisma/client';
import { Player, PlayerStatus } from '../../../domain/entities/Player.js';

export class PlayerMapper {
    // From Domain Entity to Prisma Object
    static toPersistence(player: Player) {
        return {
            id: player.getId(),
            userId: player.getUserId(),
            registrationNumber: player.getRegistrationNumber(),
            federation: player.getFederation(),
            seasonStartYear: player.getSeason().getStartYear(),
            deletedAt: player.getDeletedAt(),
            status: player.getStatus() as PrismaPlayerStatus,
        };
    }

    // From Prisma Object to Domain Entity
    static toDomain(prismaPlayer: PrismaPlayer): Player {
        return Player.rehydrate({
            id: prismaPlayer.id,
            userId: prismaPlayer.userId,
            registrationNumber: prismaPlayer.registrationNumber,
            federation: prismaPlayer.federation,
            seasonStartYear: prismaPlayer.seasonStartYear,
            deletedAt: prismaPlayer.deletedAt,
            status: prismaPlayer.status as PlayerStatus,
        });
    }
}
