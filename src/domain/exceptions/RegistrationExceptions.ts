export class InvalidRegistrationPeriodException extends Error {
    constructor() {
        super('Registration period is invalid');
        this.name = 'InvalidRegistrationPeriodException';
    }
}

export class PlayerAlreadyCheckedInException extends Error {
    constructor() {
        super('Player already checked in');
        this.name = 'PlayerAlreadyCheckedInException';
    }
}

export class PlayerNotCheckedInException extends Error {
    constructor() {
        super('Player not checked in');
        this.name = 'PlayerNotCheckedInException';
    }
}

export class PlayerAlreadyRegisteredException extends Error {
    constructor() {
        super('Player is already registered in this tournament');
        this.name = 'PlayerAlreadyRegisteredException';
    }
}

export class PlayerNotRegisteredException extends Error {
    constructor() {
        super('Player is not registered in this tournament');
        this.name = 'PlayerNotRegisteredException';
    }
}

export class RegistrationNotClosedException extends Error {
    constructor() {
        super('Registration is not closed');
        this.name = 'RegistrationNotClosedException';
    }
}