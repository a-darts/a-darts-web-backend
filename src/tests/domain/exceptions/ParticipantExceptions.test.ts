import { describe, it, expect } from 'vitest';
import * as Exceptions from '../../../domain/exceptions/ParticipantExceptions';

describe('ParticipantExceptions', () => {
    it('should instantiate all exceptions correctly', () => {
        const exParticipantAlreadyCheckedInException = new Exceptions.ParticipantAlreadyCheckedInException();
        expect(exParticipantAlreadyCheckedInException).toBeInstanceOf(Error);
        expect(exParticipantAlreadyCheckedInException.name).toBe('ParticipantAlreadyCheckedInException');
        const exParticipantNotCheckedInException = new Exceptions.ParticipantNotCheckedInException();
        expect(exParticipantNotCheckedInException).toBeInstanceOf(Error);
        expect(exParticipantNotCheckedInException.name).toBe('ParticipantNotCheckedInException');
        const exParticipantAlreadyRegisteredException = new Exceptions.ParticipantAlreadyRegisteredException();
        expect(exParticipantAlreadyRegisteredException).toBeInstanceOf(Error);
        expect(exParticipantAlreadyRegisteredException.name).toBe('ParticipantAlreadyRegisteredException');
        const exParticipantNotRegisteredException = new Exceptions.ParticipantNotRegisteredException();
        expect(exParticipantNotRegisteredException).toBeInstanceOf(Error);
        expect(exParticipantNotRegisteredException.name).toBe('ParticipantNotRegisteredException');
        const exRegisteredParticipantNotFoundException = new Exceptions.RegisteredParticipantNotFoundException();
        expect(exRegisteredParticipantNotFoundException).toBeInstanceOf(Error);
        expect(exRegisteredParticipantNotFoundException.name).toBe('RegisteredParticipantNotFoundException');
        const exRegistratedParticipantsEmptyException = new Exceptions.RegistratedParticipantsEmptyException();
        expect(exRegistratedParticipantsEmptyException).toBeInstanceOf(Error);
        expect(exRegistratedParticipantsEmptyException.name).toBe('RegistratedParticipantsEmptyException');
        const exRegistratedParticipantsNotEnoughException = new Exceptions.RegistratedParticipantsNotEnoughException();
        expect(exRegistratedParticipantsNotEnoughException).toBeInstanceOf(Error);
        expect(exRegistratedParticipantsNotEnoughException.name).toBe('RegistratedParticipantsNotEnoughException');
        const exRegistratedParticipantsTypesException = new Exceptions.RegistratedParticipantsTypesException();
        expect(exRegistratedParticipantsTypesException).toBeInstanceOf(Error);
        expect(exRegistratedParticipantsTypesException.name).toBe('RegistratedParticipantsTypesException');
    });
});
