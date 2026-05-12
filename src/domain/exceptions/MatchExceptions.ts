export class MatchNotPendingException extends Error {
    constructor() {
        super('Match is not pending');
        this.name = 'MatchNotPendingException';
    }
}

export class MatchNotInProgressException extends Error {
    constructor() {
        super('Match is not in progress');
        this.name = 'MatchNotInProgressException';
    }
}

export class MatchNotSuspendedException extends Error {
    constructor() {
        super('Match is not suspended');
        this.name = 'MatchNotSuspendedException';
    }
}

export class MatchFinishedException extends Error {
    constructor() {
        super('Match is finished');
        this.name = 'MatchFinishedException';
    }
}

export class ParticipantNotFoundException extends Error {
    constructor() {
        super('Participant not found');
        this.name = 'ParticipantNotFoundException';
    }
}

export class ParticipantNotRegisteredInTournamentException extends Error {
    constructor(index: number) {
        super(`Participant ${index} not registered in this tournament`);
        this.name = 'ParticipantNotRegisteredInTournamentException';
    }
}

export class MatchAlreadyExistsException extends Error {
    constructor() {
        super('Match already exists');
        this.name = 'MatchAlreadyExistsException';
    }
}

