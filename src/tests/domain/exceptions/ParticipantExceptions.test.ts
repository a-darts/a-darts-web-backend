import { describe, it, expect } from 'vitest';
import * as Exceptions from '../../../domain/exceptions/ParticipantExceptions.js';
import { ParticipantAlreadyCheckedInException, ParticipantAlreadyRegisteredException, ParticipantNotCheckedInException, ParticipantNotRegisteredException, RegisteredParticipantNotFoundException, RegistratedParticipantsEmptyException, RegistratedParticipantsNotEnoughException, RegistratedParticipantsTypesException } from '../../../domain/exceptions/ParticipantExceptions.js';

describe('ParticipantExceptions', () => {
    it('should instantiate all exceptions correctly', () => {
        const exParticipantAlreadyCheckedInException = new ParticipantAlreadyCheckedInException();
        expect(exParticipantAlreadyCheckedInException).toBeInstanceOf(Error);
        expect(exParticipantAlreadyCheckedInException.name).toBe('ParticipantAlreadyCheckedInException');
        const exParticipantNotCheckedInException = new ParticipantNotCheckedInException();
        expect(exParticipantNotCheckedInException).toBeInstanceOf(Error);
        expect(exParticipantNotCheckedInException.name).toBe('ParticipantNotCheckedInException');
        const exParticipantAlreadyRegisteredException = new ParticipantAlreadyRegisteredException();
        expect(exParticipantAlreadyRegisteredException).toBeInstanceOf(Error);
        expect(exParticipantAlreadyRegisteredException.name).toBe('ParticipantAlreadyRegisteredException');
        const exParticipantNotRegisteredException = new ParticipantNotRegisteredException();
        expect(exParticipantNotRegisteredException).toBeInstanceOf(Error);
        expect(exParticipantNotRegisteredException.name).toBe('ParticipantNotRegisteredException');
        const exRegisteredParticipantNotFoundException = new RegisteredParticipantNotFoundException();
        expect(exRegisteredParticipantNotFoundException).toBeInstanceOf(Error);
        expect(exRegisteredParticipantNotFoundException.name).toBe('RegisteredParticipantNotFoundException');
        const exRegistratedParticipantsEmptyException = new RegistratedParticipantsEmptyException();
        expect(exRegistratedParticipantsEmptyException).toBeInstanceOf(Error);
        expect(exRegistratedParticipantsEmptyException.name).toBe('RegistratedParticipantsEmptyException');
        const exRegistratedParticipantsNotEnoughException = new RegistratedParticipantsNotEnoughException();
        expect(exRegistratedParticipantsNotEnoughException).toBeInstanceOf(Error);
        expect(exRegistratedParticipantsNotEnoughException.name).toBe('RegistratedParticipantsNotEnoughException');
        const exRegistratedParticipantsTypesException = new RegistratedParticipantsTypesException();
        expect(exRegistratedParticipantsTypesException).toBeInstanceOf(Error);
        expect(exRegistratedParticipantsTypesException.name).toBe('RegistratedParticipantsTypesException');
    });
});
