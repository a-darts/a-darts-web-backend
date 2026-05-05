import { Player as PrismaPlayer } from '@prisma/client';
import { Player } from '../../../domain/entities/Player.js';

export class PlayerMapper {
    // From Domain Entity to Prisma Object
    static toPersistence(player: Player) {
        return {
            userId: player.getUserId(),
            registrationNumber: player.getRegistrationNumber(),
            federation: player.getFederation(),
            seasonStartYear: player.getSeason().getStartYear(),
            seasonEndYear: player.getSeason().getEndYear(),
        };
    }

    // From Prisma Object to Domain Entity
    static toDomain(prismaPlayer: PrismaPlayer): Player {
        return Player.rehydrate({
            userId: prismaPlayer.userId,
            registrationNumber: prismaPlayer.registrationNumber,
            federation: prismaPlayer.federation,
            seasonStartYear: prismaPlayer.seasonStartYear,
            seasonEndYear: prismaPlayer.seasonEndYear,
        });
    }
}
