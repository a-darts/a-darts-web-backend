import { describe, it, expect, beforeEach } from 'vitest';
import { BracketSeedingService } from '../../../../src/domain/services/BracketSeedingService.js';
import { RegisteredParticipant, ByeParticipant } from '../../../../src/domain/entities/Participant.js';
import { RegistratedParticipantsEmptyException, RegistratedParticipantsNotEnoughException } from '../../../../src/domain/exceptions/ParticipantExceptions.js';
import { BracketPosition } from '../../../domain/entities/Bracket.js';

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

    const testCases = [
        [2, 2, 0],
        [3, 4, 1],
        [4, 4, 0],
        [5, 8, 3],
        [6, 8, 2],
        [7, 8, 1],
        [8, 8, 0],
        [9, 16, 7],
        [10, 16, 6],
        [11, 16, 5],
        [12, 16, 4],
        [13, 16, 3],
        [14, 16, 2],
        [15, 16, 1]
    ];

    describe.each(testCases)(
        'Layout generation for %i participants',
        (playersCount, expectedSize, expectedByes) => {

            it(`should generate a total of ${expectedSize} positions with ${expectedByes} Byes`, () => {
                const participants = createBulkParticipants(playersCount);
                const positions = service.generatePositions(participants);

                // Validamos tamaño total del cuadrante resultante
                expect(positions).toHaveLength(expectedSize);

                // Filtramos y contamos tipos de participantes asignados
                const reals = positions.filter(p => p.getParticipant() instanceof RegisteredParticipant);
                const byes = positions.filter(p => p.getParticipant() instanceof ByeParticipant);

                expect(reals).toHaveLength(playersCount);
                expect(byes).toHaveLength(expectedByes);

                // Verificamos que las posiciones indexadas sean del 1 al N secuencialmente
                positions.forEach((pos, idx) => {
                    expect(pos.getPosition()).toBe(idx + 1);
                });

                // Imprimimos la estructura actual en la consola
                printBracketLayout(positions, playersCount, expectedByes);
            });
        }
    );

    const createBulkParticipants = (count: number): RegisteredParticipant[] => {
        return Array.from({ length: count }, (_, i) =>
            RegisteredParticipant.create(`p${i + 1}`, 't1', `player ${i + 1}`, 'ARAGON')
        );
    };

    const printBracketLayout = (positions: BracketPosition[], playersCount: number, byesCount: number): void => {
        console.log(`\n--- ${playersCount} PLAYERS (${byesCount} BYE) ---`);
        positions.forEach(pos => {
            const participant = pos.getParticipant();
            if (participant instanceof RegisteredParticipant) {
                console.log(participant.getAlias() || `player`);
            } else if (participant instanceof ByeParticipant) {
                console.log('bye');
            }
        });
    };
});
