import { describe, it, expect } from 'vitest';
import * as Exceptions from '../../../domain/exceptions/RegistrationExceptions';

describe('RegistrationExceptions', () => {
    it('should instantiate all exceptions correctly', () => {
        const exInvalidRegistrationPeriodException = new Exceptions.InvalidRegistrationPeriodException();
        expect(exInvalidRegistrationPeriodException).toBeInstanceOf(Error);
        expect(exInvalidRegistrationPeriodException.name).toBe('InvalidRegistrationPeriodException');
        const exRegistrationNotClosedException = new Exceptions.RegistrationNotClosedException();
        expect(exRegistrationNotClosedException).toBeInstanceOf(Error);
        expect(exRegistrationNotClosedException.name).toBe('RegistrationNotClosedException');
        const exRegistrationAlreadyOpenException = new Exceptions.RegistrationAlreadyOpenException();
        expect(exRegistrationAlreadyOpenException).toBeInstanceOf(Error);
        expect(exRegistrationAlreadyOpenException.name).toBe('RegistrationAlreadyOpenException');
        const exRegistrationAlreadyClosedException = new Exceptions.RegistrationAlreadyClosedException();
        expect(exRegistrationAlreadyClosedException).toBeInstanceOf(Error);
        expect(exRegistrationAlreadyClosedException.name).toBe('RegistrationAlreadyClosedException');
        const exRegistrationOpenDateInPastException = new Exceptions.RegistrationOpenDateInPastException();
        expect(exRegistrationOpenDateInPastException).toBeInstanceOf(Error);
        expect(exRegistrationOpenDateInPastException.name).toBe('RegistrationOpenDateInPastException');
        const exRegistrationCloseDateAfterTournamentException = new Exceptions.RegistrationCloseDateAfterTournamentException();
        expect(exRegistrationCloseDateAfterTournamentException).toBeInstanceOf(Error);
        expect(exRegistrationCloseDateAfterTournamentException.name).toBe('RegistrationCloseDateAfterTournamentException');
        const exRegistrationCloseDateInPastException = new Exceptions.RegistrationCloseDateInPastException();
        expect(exRegistrationCloseDateInPastException).toBeInstanceOf(Error);
        expect(exRegistrationCloseDateInPastException.name).toBe('RegistrationCloseDateInPastException');
        const exCheckInAlreadyEnabledException = new Exceptions.CheckInAlreadyEnabledException();
        expect(exCheckInAlreadyEnabledException).toBeInstanceOf(Error);
        expect(exCheckInAlreadyEnabledException.name).toBe('CheckInAlreadyEnabledException');
        const exCheckInAlreadyDisabledException = new Exceptions.CheckInAlreadyDisabledException();
        expect(exCheckInAlreadyDisabledException).toBeInstanceOf(Error);
        expect(exCheckInAlreadyDisabledException.name).toBe('CheckInAlreadyDisabledException');
    });
});
