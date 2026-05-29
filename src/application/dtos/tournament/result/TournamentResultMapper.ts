import { TournamentResultWithPlayerAndUser } from '../../../../domain/repositories/ITournamentResultRepository.js';
import { ParticipantResultDTO, TournamentResultDTO } from './TournamentResultDTO.js';

export class TournamentResultMapper {
    public static toResponse(results: TournamentResultWithPlayerAndUser[]): TournamentResultDTO {
        return {
            id: results[0].result.getId(),
            tournamentId: results[0].result.getTournamentId(),
            participantsResults: results.map(r => this.toParticipantResultDTO(r)),
        };
    }

    private static toParticipantResultDTO(result: TournamentResultWithPlayerAndUser): ParticipantResultDTO {
        return {
            participantId: result.result.getParticipantId(),
            playerId: result.result.getPlayerId(),
            alias: result.user.getAlias() ?? 'Sin alias',
            federation: result.player.getFederation() ?? 'N/A',
            finalPosition: result.result.getFinalPosition(),
            matchesWon: result.result.getMatchesWon(),
            matchesLost: result.result.getMatchesLost(),
            setsWon: result.result.getSetsWon(),
            setsLost: result.result.getSetsLost(),
            legsWon: result.result.getLegsWon(),
            legsLost: result.result.getLegsLost(),
        }
    }
}
