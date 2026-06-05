import { describe, it, expect, beforeEach } from 'vitest';
import { Bracket, BracketStatus, BracketPosition } from '../../../domain/entities/Bracket.js';
import { RegisteredParticipant, EmptyParticipant, ByeParticipant } from '../../../domain/entities/Participant.js';
import { RegistratedParticipantsEmptyException, RegistratedParticipantsNotEnoughException } from '../../../domain/exceptions/ParticipantExceptions.js';
import { BracketAlreadyFinishedException, BracketInProgressException, BracketNotInDraftException, BracketNotInDraftOrPublisedException, BracketNotInProgressException, BracketNotPublishedException, DuplicateParticipantsException, InvalidPositionsException } from '../../../domain/exceptions/BracketExceptions.js';
import { BracketSeedingService } from '../../../domain/services/BracketSeedingService.js';
import { BracketFinishedEvent } from '../../../domain/events/BracketEvents.js';

const seedingService = new BracketSeedingService();

function createParticipants(n: number): RegisteredParticipant[] {
    const participants = [];
    for (let i = 0; i < n; i++) {
        participants.push(RegisteredParticipant.rehydrate({
            id: `p-${i}`,
            playerId: `player-${i}`,
            registeredAt: new Date(),
            checkedInAt: null,
            tournamentId: 'tournament-1',
            alias: `Alias ${i}`,
            federation: 'Federation X'
        }));
    }
    return participants;
}

describe("Bracket Entity", () => {
    describe("BracketPosition", () => {
        it("should create a bracket position", () => {
            const p = RegisteredParticipant.create("1", "1", "Alias", "FED");
            const pos = BracketPosition.create(p, 1);
            expect(pos.getParticipant()).toBe(p);
            expect(pos.getPosition()).toBe(1);
            expect(pos.isBye()).toBe(false);
            expect(pos.isEmpty()).toBe(false);
        });

        it("should identify bye and empty", () => {
            const pBye = ByeParticipant.create();
            const posBye = BracketPosition.create(pBye, 1);
            expect(posBye.isBye()).toBe(true);

            const pEmpty = EmptyParticipant.create();
            const posEmpty = BracketPosition.create(pEmpty, 1);
            expect(posEmpty.isEmpty()).toBe(true);
        });
    });

    describe("Bracket Factory Methods", () => {
        it("should throw if participants count is 0 or 1", () => {
            expect(() => Bracket.createAutomatically('t1', [], seedingService)).toThrow(RegistratedParticipantsEmptyException);
            expect(() => Bracket.createAutomatically('t1', createParticipants(1), seedingService)).toThrow(RegistratedParticipantsNotEnoughException);
        });

        it("should create automatically with participants", () => {
            const participants = createParticipants(5);
            const bracket = Bracket.createAutomatically('t1', participants, seedingService);
            expect(bracket.getId()).toBeDefined();
            expect(bracket.getTournamentId()).toBe('t1');
            expect(bracket.getStatus()).toBe(BracketStatus.DRAFT);
            expect(bracket.getPositions().length).toBe(8); // next power of 2
            expect(bracket.getPositions().filter(p => p.isBye()).length).toBe(3);
        });

        it("should create manual empty", () => {
            const bracket = Bracket.createManualEmpty('t1', 5, seedingService);
            expect(bracket.getPositions().length).toBe(8);
            expect(bracket.getPositions().every(p => p.isEmpty())).toBe(true);
        });
    });

    describe("Bracket Domain Methods", () => {
        it("should assign participant manually", () => {
            const bracket = Bracket.createManualEmpty('t1', 4, seedingService);
            const participant = createParticipants(1)[0];

            bracket.assignParticipant(1, participant);
            expect(bracket.getPositions()[0].getParticipant()).toBe(participant);
        });

        it("should throw when assigning to non-draft/published", () => {
            const bracket = Bracket.createManualEmpty('t1', 4, seedingService);
            bracket.start(); // In progress
            expect(() => bracket.assignParticipant(1, createParticipants(1)[0])).toThrow(BracketNotInDraftOrPublisedException);
        });

        it("should throw when assigning to invalid position", () => {
            const bracket = Bracket.createManualEmpty('t1', 4, seedingService);
            expect(() => bracket.assignParticipant(5, createParticipants(1)[0])).toThrow(InvalidPositionsException);
        });

        it("should throw when assigning to non-empty position", () => {
            const bracket = Bracket.createManualEmpty('t1', 4, seedingService);
            const p = createParticipants(1)[0];
            bracket.assignParticipant(1, p);
            expect(() => bracket.assignParticipant(1, p)).toThrow(InvalidPositionsException);
        });

        it("should setup positions manually", () => {
            const bracket = Bracket.createManualEmpty('t1', 4, seedingService);
            const participants = createParticipants(4);
            const newPositions = [
                { position: 1, participant: participants[0] },
                { position: 2, participant: participants[1] },
                { position: 3, participant: participants[2] },
                { position: 4, participant: participants[3] }
            ];

            bracket.setupPositions(newPositions);
            expect(bracket.getPositions().length).toBe(4);
            expect(bracket.getPositions()[0].getParticipant()).toBe(participants[0]);
        });

        it("should throw setupPositions bracket not in draft or published", () => {
            const bracket = Bracket.createManualEmpty('t1', 4, seedingService);
            bracket.start();
            expect(() => bracket.setupPositions([])).toThrow(BracketNotInDraftOrPublisedException);
        });

        it("should throw setupPositions invalid length", () => {
            const bracket = Bracket.createManualEmpty('t1', 4, seedingService);
            expect(() => bracket.setupPositions([])).toThrow(InvalidPositionsException);
        });

        it("should throw setupPositions duplicates", () => {
            const bracket = Bracket.createManualEmpty('t1', 4, seedingService);
            const p = createParticipants(1)[0];
            const newPositions = [
                { position: 1, participant: p },
                { position: 2, participant: p },
                { position: 3, participant: EmptyParticipant.create() },
                { position: 4, participant: EmptyParticipant.create() }
            ];
            expect(() => bracket.setupPositions(newPositions)).toThrow(DuplicateParticipantsException);
        });

        it("should reshuffle", () => {
            const bracket = Bracket.createAutomatically('t1', createParticipants(4), seedingService);
            bracket.reshuffle(seedingService);
            expect(bracket.getPositions().length).toBe(4);
        });

        it("should throw reshuffle when not draft/published", () => {
            const bracket = Bracket.createAutomatically('t1', createParticipants(4), seedingService);
            bracket.start();
            expect(() => bracket.reshuffle(seedingService)).toThrow(BracketNotInDraftOrPublisedException);
        });
    });

    describe("Bracket Rondas", () => {
        it("should return correct total rounds", () => {
            let b = Bracket.createManualEmpty('t1', 4, seedingService); // 4 -> 2 rounds
            expect(b.getTotalRounds()).toBe(2);

            b = Bracket.createManualEmpty('t1', 8, seedingService); // 8 -> 3 rounds
            expect(b.getTotalRounds()).toBe(3);

            b = Bracket.createManualEmpty('t1', 16, seedingService); // 16 -> 4 rounds
            expect(b.getTotalRounds()).toBe(4);
        });

        it("should return 0 rounds for 1 participant or empty", () => {
            const b = Bracket.rehydrate({ id: 'b', status: BracketStatus.DRAFT, tournamentId: 't1', positions: [] });
            expect(b.getTotalRounds()).toBe(0);
        });
    });

    describe("Status Management", () => {
        let bracket: Bracket;
        beforeEach(() => {
            bracket = Bracket.createAutomatically('t1', createParticipants(4), seedingService);
        });

        it("should manage publish and unpublish", () => {
            expect(bracket.isPublished()).toBe(false);

            bracket.publish();
            expect(bracket.getStatus()).toBe(BracketStatus.PUBLISHED);
            expect(bracket.isPublished()).toBe(true);

            expect(() => bracket.publish()).toThrow(BracketNotInDraftException);

            bracket.unpublish();
            expect(bracket.getStatus()).toBe(BracketStatus.DRAFT);

            expect(() => bracket.unpublish()).toThrow(BracketNotPublishedException);
        });

        it("should manage start and finish", () => {
            expect(() => bracket.finish()).toThrow(BracketNotInProgressException);

            bracket.start(); // Works from DRAFT or PUBLISHED
            expect(bracket.getStatus()).toBe(BracketStatus.IN_PROGRESS);

            expect(() => bracket.start()).toThrow(BracketNotInDraftOrPublisedException);

            bracket.finish();
            expect(bracket.getStatus()).toBe(BracketStatus.FINISHED);
            expect(bracket.pullEvents()[0]).toBeInstanceOf(BracketFinishedEvent);

            const b2 = Bracket.createAutomatically('t1', createParticipants(4), seedingService);
            expect(() => b2.finish()).toThrow(BracketNotInProgressException);
        });

        it("should manage cancel", () => {
            bracket.cancel();
            expect(bracket.getStatus()).toBe(BracketStatus.CANCELLED);

            const b2 = Bracket.createAutomatically('t1', createParticipants(4), seedingService);
            b2.start();
            b2.finish();
            expect(() => b2.cancel()).toThrow(BracketAlreadyFinishedException);
        });

        it("should manage delete", () => {
            bracket.delete(); // fine

            const b2 = Bracket.createAutomatically('t1', createParticipants(4), seedingService);
            b2.start();
            expect(() => b2.delete()).toThrow(BracketInProgressException);
            b2.finish();
            expect(() => b2.delete()).toThrow(BracketAlreadyFinishedException);
        });
    });

    describe("Rehydrate", () => {
        it("should rehydrate bracket", () => {
            const b = Bracket.rehydrate({
                id: 'b1',
                status: BracketStatus.IN_PROGRESS,
                tournamentId: 't1',
                positions: []
            });
            expect(b.getId()).toBe('b1');
            expect(b.getStatus()).toBe(BracketStatus.IN_PROGRESS);
            expect(b.getTournamentId()).toBe('t1');
            expect(b.getPositions().length).toBe(0);
        });
    });
});
