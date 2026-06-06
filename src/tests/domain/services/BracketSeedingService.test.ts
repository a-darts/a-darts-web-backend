import { describe, it, expect, beforeEach } from 'vitest';
import { BracketSeedingService } from '../../../../src/domain/services/BracketSeedingService.js';
import { RegisteredParticipant, ByeParticipant } from '../../../../src/domain/entities/Participant.js';
import { RegistratedParticipantsEmptyException, RegistratedParticipantsNotEnoughException } from '../../../../src/domain/exceptions/ParticipantExceptions.js';

describe('BracketSeedingService', () => {
    let service: BracketSeedingService;

    beforeEach(() => {
        service = new BracketSeedingService();
    });

    it('should throw RegistratedParticipantsEmptyException if count is 0', () => {
        expect(() => service.validateCount(0)).toThrow(RegistratedParticipantsEmptyException);
    });

    it('should throw RegistratedParticipantsNotEnoughException if count is 1', () => {
        expect(() => service.validateCount(1)).toThrow(RegistratedParticipantsNotEnoughException);
    });

    it('should calculate correct bracket size', () => {
        expect(service.calculateBracketSize(2)).toBe(2);
        expect(service.calculateBracketSize(3)).toBe(4);
        expect(service.calculateBracketSize(5)).toBe(8);
        expect(service.calculateBracketSize(8)).toBe(8);
        expect(service.calculateBracketSize(9)).toBe(16);
    });

    it('should generate positions for 2 participants', () => {
        const p1 = RegisteredParticipant.create('p1', 't1', 'player 1', 'ARAGON');
        const p2 = RegisteredParticipant.create('p2', 't1', 'player 2', 'ARAGON');
        const positions = service.generatePositions([p1, p2]);

        expect(positions).toHaveLength(2);
        expect(positions[0].getParticipant()).toBeInstanceOf(RegisteredParticipant);
        expect(positions[1].getParticipant()).toBeInstanceOf(RegisteredParticipant);
        expect(positions[0].getPosition()).toBe(1);
        expect(positions[1].getPosition()).toBe(2);
    });

    it('should generate positions with Byes for 3 participants', () => {
        const p1 = RegisteredParticipant.create('p1', 't1', 'player 1', 'ARAGON');
        const p2 = RegisteredParticipant.create('p2', 't1', 'player 2', 'ARAGON');
        const p3 = RegisteredParticipant.create('p3', 't1', 'player 3', 'ARAGON');
        const positions = service.generatePositions([p1, p2, p3]);

        expect(positions).toHaveLength(4);
        const byes = positions.filter(p => p.getParticipant() instanceof ByeParticipant);
        expect(byes).toHaveLength(1);
    });
});
