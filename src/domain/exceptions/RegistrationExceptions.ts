export class InvalidRegistrationPeriodException extends Error {
    constructor() {
        super('Registration period is invalid');
        this.name = 'InvalidRegistrationPeriodException';
    }
}

export class RegistrationNotClosedException extends Error {
    constructor() {
        super('Registration is not closed');
        this.name = 'RegistrationNotClosedException';
    }
}