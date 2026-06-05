import { describe, it, expect, beforeEach } from 'vitest';
import { SingleEliminationMatchGenerator } from '../../../../src/domain/services/SingleEliminationMatchGenerator.js';
import { BracketPosition } from '../../../../src/domain/entities/Bracket.js';
import { RegisteredParticipant, ByeParticipant, EmptyParticipant, ParticipantTypes } from '../../../../src/domain/entities/Participant.js';

describe('SingleEliminationMatchGenerator', () => {
    let generator: SingleEliminationMatchGenerator;

    beforeEach(() => {
        generator = new SingleEliminationMatchGenerator();
    });

    it('should calculate total rounds correctly', () => {
        expect(generator.calculateTotalRounds(0)).toBe(0);
        expect(generator.calculateTotalRounds(1)).toBe(0);
        expect(generator.calculateTotalRounds(2)).toBe(1);
        expect(generator.calculateTotalRounds(4)).toBe(2);
        expect(generator.calculateTotalRounds(8)).toBe(3);
    });

    it('should return null for next match coordinates if it is the final round', () => {
        expect(generator.getNextMatchCoordinates(1, 1, 2)).toBeNull();
        expect(generator.getNextMatchCoordinates(3, 1, 8)).toBeNull();
    });

    it('should return next match coordinates correctly', () => {
        const next1 = generator.getNextMatchCoordinates(1, 1, 8);
        expect(next1).toEqual({ round: 2, matchIndex: 1, slot: 'P1' });

        const next2 = generator.getNextMatchCoordinates(1, 2, 8);
        expect(next2).toEqual({ round: 2, matchIndex: 1, slot: 'P2' });

        const next3 = generator.getNextMatchCoordinates(1, 3, 8);
        expect(next3).toEqual({ round: 2, matchIndex: 2, slot: 'P1' });

        const next4 = generator.getNextMatchCoordinates(2, 1, 8);
        expect(next4).toEqual({ round: 3, matchIndex: 1, slot: 'P1' });
    });

    it('should generate matches propagating BYEs correctly', () => {
        const p1 = RegisteredParticipant.create('p1', 't1', 'player 1', 'ARAGON');
        const p2 = RegisteredParticipant.create('p2', 't1', 'player 2', 'ARAGON');
        const p3 = RegisteredParticipant.create('p3', 't1', 'player 3', 'ARAGON');
        const bye = ByeParticipant.create();

        // Standard seeding for 3 participants: 1 vs BYE, 2 vs 3
        const positions = [
            BracketPosition.create(p1, 1),
            BracketPosition.create(bye, 2),
            BracketPosition.create(p3, 3),
            BracketPosition.create(p2, 4),
        ];

        const matches = generator.generateMatches('t1', positions);

        // N=4 -> 3 matches total
        expect(matches).toHaveLength(3);

        // R1 M1: P1 vs BYE
        const r1m1 = matches.find(m => m.getRound() === 1 && m.getMatchIndex() === 1);
        expect(r1m1).toBeDefined();
        expect(r1m1?.getParticipant1Id()).toBe(p1.getId());
        expect(r1m1?.getParticipant2Type()).toBe(ParticipantTypes.BYE);

        // R1 M2: P3 vs P2
        const r1m2 = matches.find(m => m.getRound() === 1 && m.getMatchIndex() === 2);
        expect(r1m2).toBeDefined();
        expect(r1m2?.getParticipant1Id()).toBe(p3.getId());
        expect(r1m2?.getParticipant2Id()).toBe(p2.getId());

        // R2 M1: P1 (promoted from BYE) vs EMPTY (waiting for R1M2 winner)
        const r2m1 = matches.find(m => m.getRound() === 2 && m.getMatchIndex() === 1);
        expect(r2m1).toBeDefined();
        expect(r2m1?.getParticipant1Id()).toBe(p1.getId());
        expect(r2m1?.getParticipant2Type()).toBe(ParticipantTypes.EMPTY);
    });

    it('should resolve Bye promotion correctly when P2 is BYE and P1 is BYE', () => {
        const bye1 = ByeParticipant.create();
        const bye2 = ByeParticipant.create();

        const positions = [
            BracketPosition.create(bye1, 1),
            BracketPosition.create(bye2, 2)
        ];

        const matches = generator.generateMatches('t1', positions);
        expect(matches).toHaveLength(1);

        // both are byes
        expect(matches[0].getParticipant1Type()).toBe(ParticipantTypes.BYE);
        expect(matches[0].getParticipant2Type()).toBe(ParticipantTypes.BYE);
    });

    // it('should resolve Bye promotion correctly when P1 is BYE and P2 is empty', () => {
    //     const p1 = ByeParticipant.create();
    //     const p2 = EmptyParticipant.create();
    //     const p3 = RegisteredParticipant.create('p3', 't1', 'player 3', 'ARAGON');
    //     const p4 = RegisteredParticipant.create('p4', 't1', 'player 4', 'ARAGON');

    //     const positions = [
    //         BracketPosition.create(p1, 1),
    //         BracketPosition.create(p2, 2),
    //         BracketPosition.create(p3, 3),
    //         BracketPosition.create(p4, 4),
    //     ];

    //     const matches = generator.generateMatches('t1', positions);
    //     expect(matches).toHaveLength(3);

    //     // R1 M1: BYE vs EMPTY
    //     const r1m1 = matches.find(m => m.getRound() === 1 && m.getMatchIndex() === 1);
    //     expect(r1m1?.getParticipant1Type()).toBe(ParticipantTypes.BYE);
    //     expect(r1m1?.getParticipant2Type()).toBe(ParticipantTypes.EMPTY);

    //     // R2 M1: EMPTY promoted to next round
    //     const r2m1 = matches.find(m => m.getRound() === 2 && m.getMatchIndex() === 1);
    //     expect(r2m1?.getParticipant1Type()).toBe(ParticipantTypes.EMPTY);
    //     expect(r2m1?.getParticipant2Type()).toBe(ParticipantTypes.EMPTY);
    // });

    it('should resolve Bye promotion correctly when P1 is BYE and P2 is REGISTERED', () => {
        const p1 = ByeParticipant.create();
        const p2 = RegisteredParticipant.create('p2', 't1', 'player 2', 'ARAGON');
        const p3 = RegisteredParticipant.create('p3', 't1', 'player 3', 'ARAGON');
        const p4 = RegisteredParticipant.create('p4', 't1', 'player 4', 'ARAGON');

        const positions = [
            BracketPosition.create(p1, 1),
            BracketPosition.create(p2, 2),
            BracketPosition.create(p3, 3),
            BracketPosition.create(p4, 4),
        ];

        const matches = generator.generateMatches('t1', positions);
        expect(matches).toHaveLength(3);

        // R1 M1: BYE vs REGISTERED
        const r1m1 = matches.find(m => m.getRound() === 1 && m.getMatchIndex() === 1);
        expect(r1m1?.getParticipant1Type()).toBe(ParticipantTypes.BYE);
        expect(r1m1?.getParticipant2Type()).toBe(ParticipantTypes.REGISTERED);

        // R2 M1: REGISTERED p2 promoted to next round
        const r2m1 = matches.find(m => m.getRound() === 2 && m.getMatchIndex() === 1);
        expect(r2m1?.getParticipant1Type()).toBe(ParticipantTypes.REGISTERED);
        expect(r2m1?.getParticipant2Type()).toBe(ParticipantTypes.EMPTY);
    });

    it('should resolve Bye promotion correctly when P3 is BYE and P4 is REGISTERED', () => {
        const p1 = RegisteredParticipant.create('p1', 't1', 'player 1', 'ARAGON');
        const p2 = RegisteredParticipant.create('p2', 't1', 'player 2', 'ARAGON');
        const p3 = ByeParticipant.create();
        const p4 = RegisteredParticipant.create('p4', 't1', 'player 4', 'ARAGON');

        const positions = [
            BracketPosition.create(p1, 1),
            BracketPosition.create(p2, 2),
            BracketPosition.create(p3, 3),
            BracketPosition.create(p4, 4),
        ];

        const matches = generator.generateMatches('t1', positions);
        expect(matches).toHaveLength(3);

        // R1 M2: BYE vs REGISTERED
        const r1m2 = matches.find(m => m.getRound() === 1 && m.getMatchIndex() === 2);
        expect(r1m2?.getParticipant1Type()).toBe(ParticipantTypes.BYE);
        expect(r1m2?.getParticipant2Type()).toBe(ParticipantTypes.REGISTERED);

        // R2 M1: REGISTERED p4 promoted to next round
        const r2m1 = matches.find(m => m.getRound() === 2 && m.getMatchIndex() === 1);
        expect(r2m1?.getParticipant1Type()).toBe(ParticipantTypes.EMPTY);
        expect(r2m1?.getParticipant2Type()).toBe(ParticipantTypes.REGISTERED);
    });
});
