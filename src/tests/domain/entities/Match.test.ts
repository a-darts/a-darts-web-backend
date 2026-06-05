import { describe, it, expect } from 'vitest';
import { Match, MatchStatus, MatchScore, ParticipantScore } from "../../../domain/entities/Match.js";
import { ParticipantTypes } from "../../../domain/entities/Participant.js";
import { MatchAlreadyFinishedException, MatchNotInProgressException, MatchNotReadyException, MatchNotSuspendedException, ParticipantNotFoundInMatchException } from "../../../domain/exceptions/MatchExceptions.js";
import { MatchFinishedEvent } from "../../../domain/events/MatchEvents.js";

describe("Match Entity", () => {
    describe("MatchScore and ParticipantScore", () => {
        it("should win a leg", () => {
            let score = ParticipantScore.create();
            score = score.winLeg();
            expect(score.getLegsWon()).toBe(1);
            expect(score.getSetsWon()).toBe(0);
        });

        it("should win a set", () => {
            let score = ParticipantScore.create();
            score = score.winLeg().winSet();
            expect(score.getLegsWon()).toBe(0);
            expect(score.getSetsWon()).toBe(1);
        });

        it("should create new set", () => {
            let score = ParticipantScore.create();
            score = score.winSet().winLeg();
            score = score.newSet();
            expect(score.getSetsWon()).toBe(1);
            expect(score.getLegsWon()).toBe(0);
        });

        it("should manage MatchScore", () => {
            let matchScore = MatchScore.create();
            matchScore = matchScore.addWinLeg('P1');
            expect(matchScore.getParticipant1Score().getLegsWon()).toBe(1);
            expect(matchScore.getParticipant2Score().getLegsWon()).toBe(0);

            matchScore = matchScore.addWinSet('P2');
            expect(matchScore.getParticipant2Score().getSetsWon()).toBe(1);
            expect(matchScore.getParticipant1Score().getSetsWon()).toBe(0);
        });

        it("should rehydrate MatchScore", () => {
            const ms = MatchScore.rehydrate({ setsWon: 1, legsWon: 2 }, { setsWon: 3, legsWon: 4 });
            expect(ms.getParticipant1Score().getSetsWon()).toBe(1);
            expect(ms.getParticipant1Score().getLegsWon()).toBe(2);
            expect(ms.getParticipant2Score().getSetsWon()).toBe(3);
            expect(ms.getParticipant2Score().getLegsWon()).toBe(4);
        });
    });

    describe("Match", () => {
        it("should create a pending match", () => {
            const match = Match.create("tourn1", "p1", null, ParticipantTypes.REGISTERED, ParticipantTypes.EMPTY, 1, 1);
            expect(match.getId()).toBeDefined();
            expect(match.getStatus()).toBe(MatchStatus.PENDING);
            expect(match.getRound()).toBe(1);
            expect(match.getMatchIndex()).toBe(1);
            expect(match.getParticipant1Id()).toBe("p1");
            expect(match.getParticipant2Id()).toBeNull();
            expect(match.getParticipant1Type()).toBe(ParticipantTypes.REGISTERED);
            expect(match.getParticipant2Type()).toBe(ParticipantTypes.EMPTY);
            expect(match.getTournamentId()).toBe("tourn1");
            expect(match.getStartedAt()).toBeNull();
            expect(match.getFinishedAt()).toBeNull();
        });

        it("should create a ready match", () => {
            const match = Match.create("tourn1", "p1", "p2", ParticipantTypes.REGISTERED, ParticipantTypes.REGISTERED, 1, 1);
            expect(match.getStatus()).toBe(MatchStatus.READY);
        });

        it("should create a finished bye match", () => {
            const match = Match.create("tourn1", "p1", "p2", ParticipantTypes.REGISTERED, ParticipantTypes.BYE, 1, 1);
            expect(match.getStatus()).toBe(MatchStatus.FINISHED);
            expect(match.getWinnerId()).toBe("p1");
            expect(match.getFinishedAt()).toBeInstanceOf(Date);

            const match2 = Match.create("tourn1", "p1", "p2", ParticipantTypes.BYE, ParticipantTypes.REGISTERED, 1, 1);
            expect(match2.getWinnerId()).toBe("p2");
        });

        it("should set score", () => {
            const match = Match.create("tourn1", "p1", "p2", ParticipantTypes.REGISTERED, ParticipantTypes.REGISTERED, 1, 1);
            match.setScore(1, 2, 3, 4);
            expect(match.getMatchScore().getParticipant1Score().getSetsWon()).toBe(1);
            expect(match.getMatchScore().getParticipant1Score().getLegsWon()).toBe(2);
            expect(match.getMatchScore().getParticipant2Score().getSetsWon()).toBe(3);
            expect(match.getMatchScore().getParticipant2Score().getLegsWon()).toBe(4);
        });

        it("should add win leg to match", () => {
            const match = Match.create("tourn1", "p1", "p2", ParticipantTypes.REGISTERED, ParticipantTypes.REGISTERED, 1, 1);
            expect(() => match.addWinLeg("p1")).toThrow(MatchNotInProgressException);
            
            match.start();
            match.addWinLeg("p1");
            expect(match.getMatchScore().getParticipant1Score().getLegsWon()).toBe(1);

            expect(() => match.addWinLeg("p3")).toThrow(ParticipantNotFoundInMatchException);
        });

        it("should add win set to match", () => {
            const match = Match.create("tourn1", "p1", "p2", ParticipantTypes.REGISTERED, ParticipantTypes.REGISTERED, 1, 1);
            expect(() => match.addWinSet("p1")).toThrow(MatchNotInProgressException);
            
            match.start();
            match.addWinSet("p1");
            expect(match.getMatchScore().getParticipant1Score().getSetsWon()).toBe(1);
        });

        it("should determine winner correctly", () => {
            const match = Match.create("tourn1", "p1", "p2", ParticipantTypes.REGISTERED, ParticipantTypes.REGISTERED, 1, 1);
            
            // Not finished
            expect(match.getWinnerId()).toBeNull();

            match.start();
            match.addWinSet("p2");
            match.finish();
            expect(match.getWinnerId()).toBe("p2");

            const matchTie = Match.create("tourn1", "p1", "p2", ParticipantTypes.REGISTERED, ParticipantTypes.REGISTERED, 1, 1);
            matchTie.start();
            matchTie.finish();
            expect(matchTie.getWinnerId()).toBeNull(); // draw
        });

        it("should determine winner by legs if sets are tied", () => {
            const match = Match.create("tourn1", "p1", "p2", ParticipantTypes.REGISTERED, ParticipantTypes.REGISTERED, 1, 1);
            match.start();
            match.addWinSet("p1");
            match.addWinSet("p2"); // tie sets
            match.addWinLeg("p1"); // p1 has more legs
            match.finish();
            expect(match.getWinnerId()).toBe("p1");
        });
        
        it("should determine winner by legs if sets are tied (p2 wins)", () => {
            const match = Match.create("tourn1", "p1", "p2", ParticipantTypes.REGISTERED, ParticipantTypes.REGISTERED, 1, 1);
            match.start();
            match.addWinLeg("p2"); // p2 has more legs
            match.finish();
            expect(match.getWinnerId()).toBe("p2");
        });

        it("should promote winner", () => {
            const match = Match.create("tourn1", "p1", null, ParticipantTypes.REGISTERED, ParticipantTypes.EMPTY, 1, 1);
            match.promoteWinner("p3", 'P2');
            expect(match.getStatus()).toBe(MatchStatus.READY);
            expect(match.getParticipant2Id()).toBe("p3");

            const match2 = Match.create("tourn1", null, "p2", ParticipantTypes.EMPTY, ParticipantTypes.REGISTERED, 1, 1);
            match2.promoteWinner("p4", 'P1');
            expect(match2.getStatus()).toBe(MatchStatus.READY);
            expect(match2.getParticipant1Id()).toBe("p4");
        });

        it("should throw exception when promoting in finished match", () => {
            const match = Match.create("tourn1", "p1", "p2", ParticipantTypes.REGISTERED, ParticipantTypes.REGISTERED, 1, 1);
            match.start();
            match.finish();
            expect(() => match.promoteWinner("p3", 'P1')).toThrow(MatchAlreadyFinishedException);
        });

        it("should manage status: start, suspend, resume, cancel, finish", () => {
            const match = Match.create("tourn1", "p1", "p2", ParticipantTypes.REGISTERED, ParticipantTypes.REGISTERED, 1, 1);
            
            expect(() => match.finish()).toThrow(MatchNotInProgressException);
            expect(() => match.suspend()).toThrow(MatchNotInProgressException);
            expect(() => match.resume()).toThrow(MatchNotSuspendedException);

            match.start();
            expect(() => match.start()).toThrow(MatchNotReadyException);
            expect(match.getStartedAt()).toBeInstanceOf(Date);
            
            match.suspend();
            expect(match.getStatus()).toBe(MatchStatus.SUSPENDED);
            
            match.resume();
            expect(match.getStatus()).toBe(MatchStatus.IN_PROGRESS);

            match.finish();
            expect(match.getStatus()).toBe(MatchStatus.FINISHED);
            expect(match.pullEvents()[0]).toBeInstanceOf(MatchFinishedEvent);

            expect(() => match.cancel()).toThrow(MatchAlreadyFinishedException);
            
            const match2 = Match.create("tourn1", "p1", "p2", ParticipantTypes.REGISTERED, ParticipantTypes.REGISTERED, 1, 1);
            match2.cancel();
            expect(match2.getStatus()).toBe(MatchStatus.CANCELLED);
        });

        it("should rehydrate", () => {
            const data = {
                id: "m1",
                round: 2,
                matchIndex: 3,
                startedAt: new Date(),
                finishedAt: null,
                status: MatchStatus.IN_PROGRESS,
                participant1Id: "p1",
                participant2Id: "p2",
                participant1Type: ParticipantTypes.REGISTERED,
                participant2Type: ParticipantTypes.REGISTERED,
                matchScore: {
                    participant1: { setsWon: 1, legsWon: 2 },
                    participant2: { setsWon: 0, legsWon: 1 }
                },
                tournamentId: "t1"
            };
            const match = Match.rehydrate(data);
            expect(match.getId()).toBe("m1");
            expect(match.getRound()).toBe(2);
            expect(match.getMatchScore().getParticipant1Score().getSetsWon()).toBe(1);
        });
    });
});
