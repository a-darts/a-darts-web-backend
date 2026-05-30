import { Bracket } from "../entities/Bracket.js";
import { Match, MatchStatus } from "../entities/Match.js";
import { TournamentResult } from "../entities/TournamentResult.js";
import { ByeParticipant, EmptyParticipant, ParticipantTypes, RegisteredParticipant } from "../entities/Participant.js";

export class CalculateTournamentResultsService {
    public execute(bracket: Bracket, matches: Match[]): TournamentResult[] {
        const totalRounds = bracket.getTotalRounds();
        const resultsMap = new Map<string, any>();

        // 1. Initialize stats for all real participants in the bracket
        for (const position of bracket.getPositions()) {
            const participant = position.getParticipant();
            // Skip Bye and Empty participants
            if (participant instanceof ByeParticipant || participant instanceof EmptyParticipant) {
                continue;
            }

            if (participant instanceof RegisteredParticipant) {
                resultsMap.set(participant.getId(), {
                    tournamentId: bracket.getTournamentId(),
                    participantId: participant.getId(),
                    playerId: participant.getPlayerId(),
                    matchesWon: 0,
                    matchesLost: 0,
                    setsWon: 0,
                    setsLost: 0,
                    legsWon: 0,
                    legsLost: 0,
                    finalPosition: 1 // Default to 1, updated if they lose
                });
            }
        }

        // 2. Iterate through matches to accumulate stats
        for (const match of matches) {
            if (match.getStatus() !== MatchStatus.FINISHED) {
                continue; // Only process finished matches
            }

            const p1Id = match.getParticipant1Id();
            const p2Id = match.getParticipant2Id();
            const winnerId = match.getWinnerId();

            const isByeMatch =
                (match.getParticipant1Type() === ParticipantTypes.BYE) ||
                (match.getParticipant2Type() === ParticipantTypes.BYE);

            if (p1Id && resultsMap.has(p1Id)) {
                const stats = resultsMap.get(p1Id);
                const score = match.getMatchScore().getParticipant1Score();
                const opponentScore = match.getMatchScore().getParticipant2Score();

                if (!isByeMatch) {
                    stats.setsWon += score.getSetsWon();
                    stats.legsWon += score.getLegsWon();
                    stats.setsLost += opponentScore.getSetsWon();
                    stats.legsLost += opponentScore.getLegsWon();
                }

                if (winnerId === p1Id) {
                    stats.matchesWon += 1;
                } else if (winnerId === p2Id) {
                    stats.matchesLost += 1;
                    stats.finalPosition = this.calculatePosition(totalRounds, match.getRound());
                }
            }

            if (p2Id && resultsMap.has(p2Id)) {
                const stats = resultsMap.get(p2Id);
                const score = match.getMatchScore().getParticipant2Score();
                const opponentScore = match.getMatchScore().getParticipant1Score();

                if (!isByeMatch) {
                    stats.setsWon += score.getSetsWon();
                    stats.legsWon += score.getLegsWon();
                    stats.setsLost += opponentScore.getSetsWon();
                    stats.legsLost += opponentScore.getLegsWon();
                }

                if (winnerId === p2Id) {
                    stats.matchesWon += 1;
                } else if (winnerId === p1Id) {
                    stats.matchesLost += 1;
                    stats.finalPosition = this.calculatePosition(totalRounds, match.getRound());
                }
            }
        }

        // 3. Create TournamentResult entities
        const results: TournamentResult[] = [];
        for (const stats of resultsMap.values()) {
            results.push(TournamentResult.create(
                stats.tournamentId,
                stats.participantId,
                stats.playerId,
                stats.finalPosition,
                stats.matchesWon,
                stats.matchesLost,
                stats.setsWon,
                stats.setsLost,
                stats.legsWon,
                stats.legsLost
            ));
        }

        return results;
    }

    private calculatePosition(totalRounds: number, loserRound: number): number {
        // Position formula: 1 + 2^(totalRounds - loserRound)
        // e.g. Total Rounds = 3
        // Loser in Final (Round 3): 1 + 2^(0) = 2
        // Loser in Semi (Round 2): 1 + 2^(1) = 3
        // Loser in Quarter (Round 1): 1 + 2^(2) = 5
        return 1 + Math.pow(2, totalRounds - loserRound);
    }
}
