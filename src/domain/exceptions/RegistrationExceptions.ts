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

export class RegistrationOpenDateInPastException extends Error {
    constructor() {
        super('Registration opening date in past.');
        this.name = 'RegistrationOpenDateInPastException';
    }
}

export class RegistrationCloseDateAfterTournamentException extends Error {
    constructor() {
        super('Registration closing date must be before the tournament start date.');
        this.name = 'RegistrationCloseDateAfterTournamentException';
    }
}
