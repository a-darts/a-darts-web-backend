import { Player as PrismaPlayer } from '@prisma/client';
import { Player } from '../../../domain/entities/Player.js';

export class PlayerMapper {
    // From Domain Entity to Prisma Object
    static toPersistence(player: Player) {
        return {
            id: player.getId(),
            userId: player.getUserId(),
            registrationNumber: player.getRegistrationNumber(),
            federation: player.getFederation(),
            seasonStartYear: player.getSeason().getStartYear(),
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
        });
    }
}
