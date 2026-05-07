export class ParticipantAlreadyCheckedInException extends Error {
    constructor() {
        super('Participant already checked in');
        this.name = 'ParticipantAlreadyCheckedInException';
    }
}

export class ParticipantNotCheckedInException extends Error {
    constructor() {
        super('Participant not checked in');
        this.name = 'ParticipantNotCheckedInException';
    }
}

export class ParticipantAlreadyRegisteredException extends Error {
    constructor() {
        super('Participant is already registered in this tournament');
        this.name = 'ParticipantAlreadyRegisteredException';
    }
}

export class ParticipantNotRegisteredException extends Error {
    constructor() {
        super('Participant is not registered in this tournament');
        this.name = 'ParticipantNotRegisteredException';
    }
}

export class RegisteredParticipantNotFoundException extends Error {
    constructor() {
        super('Registered participant not found');
        this.name = 'RegisteredParticipantNotFoundException';
    }
}
