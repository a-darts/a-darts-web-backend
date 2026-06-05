import { describe, it, expect } from 'vitest';
import * as Exceptions from '../../../domain/exceptions/TournamentResultException';

describe('TournamentResultException', () => {
    it('should instantiate all exceptions correctly', () => {
        const exTournamentResultNotFoundException = new Exceptions.TournamentResultNotFoundException();
        expect(exTournamentResultNotFoundException).toBeInstanceOf(Error);
        expect(exTournamentResultNotFoundException.name).toBe('TournamentResultNotFoundException');
    });
});
