export class InvalidRegistrationPeriodException extends Error {
    constructor() {
        super('Registration period is invalid');
        this.name = 'InvalidRegistrationPeriodException';
    }
}

export class InvalidRegistrationStatusException extends Error {
    constructor() {
        super('Invalid registration status');
        this.name = 'InvalidRegistrationStatusException';
    }
}

export class RegistrationNotClosedException extends Error {
    constructor() {
        super('Registration is not closed');
        this.name = 'RegistrationNotClosedException';
    }
}

export class RegistrationAlreadyOpenException extends Error {
    constructor() {
        super('Registration is already open');
        this.name = 'RegistrationAlreadyOpenException';
    }
}

export class RegistrationAlreadyClosedException extends Error {
    constructor() {
        super('Registration is already closed');
        this.name = 'RegistrationAlreadyClosedException';
    }
}
