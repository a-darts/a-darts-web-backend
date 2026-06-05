import { describe, it, expect } from 'vitest';
import { TournamentResult } from "../../../domain/entities/TournamentResult.js";

describe("TournamentResult Entity", () => {
    it("should create a tournament result", () => {
        const result = TournamentResult.create(
            "tourn1",
            "part1",
            "player1",
            1, // finalPosition
            5, // matchesWon
            0, // matchesLost
            10, // setsWon
            2, // setsLost
            30, // legsWon
            5 // legsLost
        );

        expect(result.getId()).toBeDefined();
        expect(result.getTournamentId()).toBe("tourn1");
        expect(result.getParticipantId()).toBe("part1");
        expect(result.getPlayerId()).toBe("player1");
        expect(result.getFinalPosition()).toBe(1);
        expect(result.getMatchesWon()).toBe(5);
        expect(result.getMatchesLost()).toBe(0);
        expect(result.getSetsWon()).toBe(10);
        expect(result.getSetsLost()).toBe(2);
        expect(result.getLegsWon()).toBe(30);
        expect(result.getLegsLost()).toBe(5);
    });

    it("should rehydrate a tournament result", () => {
        const data = {
            id: "result1",
            tournamentId: "tourn1",
            participantId: "part1",
            playerId: "player1",
            finalPosition: 1,
            matchesWon: 5,
            matchesLost: 0,
            setsWon: 10,
            setsLost: 2,
            legsWon: 30,
            legsLost: 5
        };

        const result = TournamentResult.rehydrate(data);

        expect(result.getId()).toBe("result1");
        expect(result.getTournamentId()).toBe("tourn1");
        expect(result.getParticipantId()).toBe("part1");
        expect(result.getPlayerId()).toBe("player1");
        expect(result.getFinalPosition()).toBe(1);
        expect(result.getMatchesWon()).toBe(5);
        expect(result.getMatchesLost()).toBe(0);
        expect(result.getSetsWon()).toBe(10);
        expect(result.getSetsLost()).toBe(2);
        expect(result.getLegsWon()).toBe(30);
        expect(result.getLegsLost()).toBe(5);
    });
});
