import { describe, it, expect, beforeEach } from 'vitest';
import { CalculateTournamentResultsService } from '../../../../src/domain/services/CalculateTournamentResultsService.js';
import { Bracket, BracketPosition, BracketStatus } from '../../../../src/domain/entities/Bracket.js';
import { Match, MatchStatus } from '../../../../src/domain/entities/Match.js';
import { MatchScore } from '../../../../src/domain/entities/Match.js';
import { RegisteredParticipant, ByeParticipant, EmptyParticipant, ParticipantTypes } from '../../../../src/domain/entities/Participant.js';

describe('CalculateTournamentResultsService', () => {
    let service: CalculateTournamentResultsService;

    beforeEach(() => {
        service = new CalculateTournamentResultsService();
    });

    it('should calculate correct results for participants', () => {
        const p1 = RegisteredParticipant.create('p1', 't1', 'player 1', 'ARAGON');
        const p2 = RegisteredParticipant.create('p2', 't1', 'player 2', 'ARAGON');
        const bye = ByeParticipant.create();
        const empty = EmptyParticipant.create();

        const positions = [
            BracketPosition.create(p1, 1),
            BracketPosition.create(p2, 2),
            BracketPosition.create(bye, 3),
            BracketPosition.create(empty, 4),
        ];

        const bracket = new Bracket('b1', BracketStatus.DRAFT, positions, 't1');

        const match1 = Match.create('t1', p1.getId(), p2.getId(), ParticipantTypes.REGISTERED, ParticipantTypes.REGISTERED, 2, 1);
        match1.start();
        // Simulating the match as finished with p1 winning.
        // Wait, the match score needs to be set.
        match1.addWinLeg(p1.getId()); // P1: 1, P2: 0

        const matches = [
            {
                getStatus: () => MatchStatus.FINISHED,
                getParticipant1Id: () => p1.getId(),
                getParticipant2Id: () => p2.getId(),
                getParticipant1Type: () => ParticipantTypes.REGISTERED,
                getParticipant2Type: () => ParticipantTypes.REGISTERED,
                getWinnerId: () => p1.getId(),
                getRound: () => 2,
                getMatchScore: () => ({
                    getParticipant1Score: () => ({ getSetsWon: () => 1, getLegsWon: () => 3 }),
                    getParticipant2Score: () => ({ getSetsWon: () => 0, getLegsWon: () => 1 })
                })
            } as unknown as Match,
            { // match p1 vs BYE
                getStatus: () => MatchStatus.FINISHED,
                getParticipant1Id: () => p1.getId(),
                getParticipant2Id: () => 'bye-id',
                getParticipant1Type: () => ParticipantTypes.REGISTERED,
                getParticipant2Type: () => ParticipantTypes.BYE,
                getWinnerId: () => p1.getId(),
                getRound: () => 1,
                getMatchScore: () => ({
                    getParticipant1Score: () => ({ getSetsWon: () => 0, getLegsWon: () => 0 }),
                    getParticipant2Score: () => ({ getSetsWon: () => 0, getLegsWon: () => 0 })
                })
            } as unknown as Match,
            { // Unfinished match should be ignored
                getStatus: () => MatchStatus.PENDING
            } as unknown as Match,
            { // Match where p2 wins
                getStatus: () => MatchStatus.FINISHED,
                getParticipant1Id: () => p1.getId(),
                getParticipant2Id: () => p2.getId(),
                getParticipant1Type: () => ParticipantTypes.REGISTERED,
                getParticipant2Type: () => ParticipantTypes.REGISTERED,
                getWinnerId: () => p2.getId(),
                getRound: () => 1,
                getMatchScore: () => ({
                    getParticipant1Score: () => ({ getSetsWon: () => 0, getLegsWon: () => 0 }),
                    getParticipant2Score: () => ({ getSetsWon: () => 2, getLegsWon: () => 3 })
                })
            } as unknown as Match
        ];

        const results = service.execute(bracket, matches);

        expect(results).toHaveLength(2); // Only for p1 and p2 (real participants)

        const p1Result = results.find(r => r.getParticipantId() === p1.getId());
        const p2Result = results.find(r => r.getParticipantId() === p2.getId());

        expect(p1Result).toBeDefined();
        expect(p2Result).toBeDefined();

        expect(p1Result?.getMatchesWon()).toBe(2);
        expect(p1Result?.getMatchesLost()).toBe(1);
        expect(p1Result?.getSetsWon()).toBe(1);
        expect(p1Result?.getLegsWon()).toBe(3);
        expect(p1Result?.getSetsLost()).toBe(2);
        expect(p1Result?.getLegsLost()).toBe(4);

        // P1 lost in round 1, formula: 1 + 2^(2 - 1) = 3
        expect(p1Result?.getFinalPosition()).toBe(3);

        expect(p2Result?.getMatchesWon()).toBe(1);
        expect(p2Result?.getMatchesLost()).toBe(1);

        // P2 lost in round 2 (final), formula: 1 + 2^(2 - 2) = 2
        expect(p2Result?.getFinalPosition()).toBe(2);
    });
});
