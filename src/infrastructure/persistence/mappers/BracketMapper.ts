import { BracketStatus as PrismaBracketStatus, Bracket as PrismaBracket, BracketPosition as PrismaBracketPosition } from '@prisma/client';
import { Bracket, BracketPosition, BracketStatus } from '../../../domain/entities/Bracket.js';
import { prisma } from '../client.js';
import { ByeParticipant, RegisteredParticipant } from '../../../domain/entities/Participant.js';

export class BracketMapper {
    // From Domain Entity to Prisma Object
    static toPersistence(bracket: Bracket) {
        return {
            id: bracket.getId(),
            status: bracket.getStatus() as PrismaBracketStatus,
            tournamentId: bracket.getTournamentId(),
            positions: {
                create: bracket.getPositions().map(pos => ({
                    position: pos.getPosition(),
                    // Si es un Bye, guardamos null
                    participantId: pos.isBye() ? null : pos.getParticipant().getId()
                })),
            }
        };
    }

    // From Prisma Object to Domain Entity
    static toDomain(prismaBracket: any): Bracket {
        const domainPositions = prismaBracket.positions.map((p: any) => {
            // Lógica para reconstruir el participante
            // Si participantId es null, es un Bye
            const participant = p.participantId
                ? RegisteredParticipant.rehydrate({
                    id: p.participantId,
                    alias: p.participant?.player?.user?.alias || 'Unknown'
                })
                : ByeParticipant.create();

            return new BracketPosition(participant, p.position);
        });
        return Bracket.rehydrate({
            id: prismaBracket.id,
            status: prismaBracket.status as BracketStatus,
            tournamentId: prismaBracket.tournamentId,
            positions: domainPositions
        });
    }
}
