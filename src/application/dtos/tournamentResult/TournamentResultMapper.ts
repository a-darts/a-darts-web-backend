import { TournamentResult } from '../../../domain/entities/TournamentResult.js';
import { TournamentResultWithPlayerAndUser, TournamentResultWithTournament } from '../../../domain/ports/repositories/ITournamentResultRepository.js';
import { PositionObject, ParticipantResultDTO, TournamentResultDTO, UserStatsDTO } from './TournamentResultDTO.js';

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

    public static toResponsePlayerStats(resultsWithTournament: TournamentResultWithTournament[]): UserStatsDTO {
        if (!resultsWithTournament || resultsWithTournament.length === 0) {
            return {
                totalTournaments: 0,
                totalMatchesPlayed: 0,
                totalMatchesWon: 0,
                totalSetsWon: 0,
                totalLegsWon: 0,
                bestPositions: [],
                allPositions: [],
            };
        }

        let totalMatchesPlayed = 0;
        let totalMatchesWon = 0;
        let totalSetsWon = 0;
        let totalLegsWon = 0;

        const positionsWithTournaments: PositionObject[] = [];

        for (const item of resultsWithTournament) {
            const res = item.result;
            const tournament = item.tournament;

            totalMatchesWon += res.getMatchesWon();
            totalSetsWon += res.getSetsWon();
            totalLegsWon += res.getLegsWon();
            totalMatchesPlayed += (res.getMatchesWon() + res.getMatchesLost());

            positionsWithTournaments.push({
                position: res.getFinalPosition(),
                tournamentId: res.getTournamentId(),
                tournamentName: tournament.getName(),
                tournamentDate: tournament.getInfo().getDateTime(),
                tournamentFederation: tournament.getInfo().getFederation(),
            });
        }

        const bestPositions = [...positionsWithTournaments]
            .sort((a, b) => a.position - b.position)
            .slice(0, 3);

        const allPositions = [...positionsWithTournaments]
            .sort((a, b) => b.tournamentDate.getTime() - a.tournamentDate.getTime());

        return {
            totalTournaments: resultsWithTournament.length,
            totalMatchesPlayed,
            totalMatchesWon,
            totalSetsWon,
            totalLegsWon,
            bestPositions,
            allPositions,
        };
    }
}
