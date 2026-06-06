import { describe, it, expect } from 'vitest';
import * as Exceptions from '../../../domain/exceptions/MailerExceptions.js';

describe('MailerExceptions', () => {
    it('should instantiate all exceptions correctly', () => {
        const exMailerSendException = new Exceptions.MailerSendException();
        expect(exMailerSendException).toBeInstanceOf(Error);
        expect(exMailerSendException.name).toBe('MailerSendException');
    });
});
