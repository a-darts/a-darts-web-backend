import { BracketStatus as PrismaBracketStatus } from '@prisma/client';
import { Bracket, BracketPosition, BracketStatus } from '../../../domain/entities/Bracket.js';
import { ByeParticipant, EmptyParticipant, RegisteredParticipant } from '../../../domain/entities/Participant.js';

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
                    isBye: pos.isBye(),
                    // Si es un Bye o un Vacío (Empty), guardamos null
                    participantId: (pos.isBye() || pos.isEmpty()) ? null : pos.getParticipant().getId()
                })),
            }
        };
    }

    // From Prisma Object to Domain Entity
    static toDomain(prismaBracket: any): Bracket {
        const domainPositions = prismaBracket.positions.map((p: any) => {
            // Lógica para reconstruir el participante
            // Si participantId es null: si p.isBye es true es un Bye, sino es un Vacío (Empty)
            const participant = p.participantId
                ? RegisteredParticipant.rehydrate({
                    id: p.participantId,
                    alias: p.participant?.player?.user?.alias || 'Unknown',
                    federation: p.participant?.player?.federation || 'Unknown',
                })
                : (p.isBye ? ByeParticipant.create() : EmptyParticipant.create());

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
