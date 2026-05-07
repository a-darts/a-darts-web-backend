import { RegisteredParticipant as PrismaRegisteredParticipant } from '@prisma/client';
import { RegisteredParticipant } from '../../../domain/entities/Participant.js';

export class RegisteredParticipantMapper {
    // From Domain Entity to Prisma Object
    static toPersistence(registeredParticipant: RegisteredParticipant) {
        return {
            id: registeredParticipant.getId(),
            playerId: registeredParticipant.getPlayerId(),
            registeredAt: registeredParticipant.getRegisteredAt(),
            checkedInAt: registeredParticipant.getCheckedInAt(),
        };
    }

    // From Prisma Object to Domain Entity
    static toDomain(prismaRegisteredParticipant: PrismaRegisteredParticipant): RegisteredParticipant {
        return RegisteredParticipant.rehydrate({
            id: prismaRegisteredParticipant.id,
            playerId: prismaRegisteredParticipant.playerId,
            registeredAt: prismaRegisteredParticipant.registeredAt,
            checkedInAt: prismaRegisteredParticipant.checkedInAt,
        });
    }
}
