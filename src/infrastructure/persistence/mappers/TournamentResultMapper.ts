import { TournamentResult } from '../../../domain/entities/TournamentResult.js';

export class TournamentResultMapper {
    static toPersistence(domain: TournamentResult): any {
        return {
            id: domain.getId(),
            tournamentId: domain.getTournamentId(),
            participantId: domain.getParticipantId(),
            playerId: domain.getPlayerId(),
            finalPosition: domain.getFinalPosition(),
            matchesWon: domain.getMatchesWon(),
            matchesLost: domain.getMatchesLost(),
            setsWon: domain.getSetsWon(),
            setsLost: domain.getSetsLost(),
            legsWon: domain.getLegsWon(),
            legsLost: domain.getLegsLost()
        };
    }

    static toDomain(data: any): TournamentResult {
        return TournamentResult.rehydrate({
            id: data.id,
            tournamentId: data.tournamentId,
            participantId: data.participantId,
            playerId: data.playerId,
            finalPosition: data.finalPosition,
            matchesWon: data.matchesWon,
            matchesLost: data.matchesLost,
            setsWon: data.setsWon,
            setsLost: data.setsLost,
            legsWon: data.legsWon,
            legsLost: data.legsLost
        });
    }
}
