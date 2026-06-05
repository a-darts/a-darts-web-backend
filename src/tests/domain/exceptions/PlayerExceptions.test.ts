import { describe, it, expect } from 'vitest';
import * as Exceptions from '../../../domain/exceptions/PlayerExceptions';

describe('PlayerExceptions', () => {
    it('should instantiate all exceptions correctly', () => {
        const exPlayerNotFoundException = new Exceptions.PlayerNotFoundException();
        expect(exPlayerNotFoundException).toBeInstanceOf(Error);
        expect(exPlayerNotFoundException.name).toBe('PlayerNotFoundException');
        const exPlayerAlreadyExistsException = new Exceptions.PlayerAlreadyExistsException();
        expect(exPlayerAlreadyExistsException).toBeInstanceOf(Error);
        expect(exPlayerAlreadyExistsException.name).toBe('PlayerAlreadyExistsException');
        const exPlayerAlreadyDeletedException = new Exceptions.PlayerAlreadyDeletedException();
        expect(exPlayerAlreadyDeletedException).toBeInstanceOf(Error);
        expect(exPlayerAlreadyDeletedException.name).toBe('PlayerAlreadyDeletedException');
        const exPlayerNotDeletedException = new Exceptions.PlayerNotDeletedException();
        expect(exPlayerNotDeletedException).toBeInstanceOf(Error);
        expect(exPlayerNotDeletedException.name).toBe('PlayerNotDeletedException');
        const exInvalidRegisteredPlayerSeasonException = new Exceptions.InvalidRegisteredPlayerSeasonException();
        expect(exInvalidRegisteredPlayerSeasonException).toBeInstanceOf(Error);
        expect(exInvalidRegisteredPlayerSeasonException.name).toBe('InvalidRegisteredPlayerSeasonException');
        const exInvalidYearException = new Exceptions.InvalidYearException();
        expect(exInvalidYearException).toBeInstanceOf(Error);
        expect(exInvalidYearException.name).toBe('InvalidYearException');
        const exInvalidSeasonException = new Exceptions.InvalidSeasonException();
        expect(exInvalidSeasonException).toBeInstanceOf(Error);
        expect(exInvalidSeasonException.name).toBe('InvalidSeasonException');
    });
});
