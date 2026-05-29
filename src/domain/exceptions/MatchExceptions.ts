export class MatchNotReadyException extends Error {
    constructor() {
        super('Match is not ready');
        this.name = 'MatchNotReadyException';
    }
}

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

export class MatchAlreadyFinishedException extends Error {
    constructor() {
        super('Match is already finished');
        this.name = 'MatchAlreadyFinishedException';
    }
}

export class MatchBoardNumberRequiredException extends Error {
    constructor() {
        super('Match board number is required');
        this.name = 'MatchBoardNumberRequiredException';
    }
}

export class MatchNotAssignedToBoardException extends Error {
    constructor() {
        super('Match is not assigned to a board');
        this.name = 'MatchNotAssignedToBoardException';
    }
}

export class ParticipantNotFoundInMatchException extends Error {
    constructor() {
        super('Participant not found in this match');
        this.name = 'ParticipantNotFoundInMatchException';
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

export class MatchNotFoundException extends Error {
    constructor() {
        super('Match not found');
        this.name = 'MatchNotFoundException';
    }
}

export class InvalidMatchStatusUpdateException extends Error {
    constructor() {
        super('Invalid match status update');
        this.name = 'InvalidMatchStatusUpdateException';
    }
}
