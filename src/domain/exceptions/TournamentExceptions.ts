export class TournamentNotInDraftException extends Error {
    constructor() {
        super('Tournament is not in draft');
        this.name = 'TournamentNotInDraftException';
    }
}

export class TournamentRegistrationNotClosedException extends Error {
    constructor() {
        super('Tournament registration is not closed');
        this.name = 'TournamentRegistrationNotClosedException';
    }
}

export class TournamentNotInProgressException extends Error {
    constructor() {
        super('Tournament is not in progress');
        this.name = 'TournamentNotInProgressException';
    }
}

export class TournamentNotPublishedException extends Error {
    constructor() {
        super('Tournament is not published');
        this.name = 'TournamentNotPublishedException';
    }
}

export class TournamentNotInDraftOrPublishedException extends Error {
    constructor() {
        super('Tournament is not in draft or published');
        this.name = 'TournamentNotInDraftOrPublishedException';
    }
}

export class TournamentAlreadyFinishedException extends Error {
    constructor() {
        super('Tournament is already finished');
        this.name = 'TournamentAlreadyFinishedException';
    }
}

export class TournamentRegistrationNotOpenException extends Error {
    constructor() {
        super('Tournament registration is not open');
        this.name = 'TournamentRegistrationNotOpenException';
    }
}

export class TournamentNotFoundException extends Error {
    constructor() {
        super('Tournament not found');
        this.name = 'TournamentNotFoundException';
    }
}

export class TournamentMaxPlayersExceededException extends Error {
    constructor() {
        super('Tournament max players exceeded');
        this.name = 'TournamentMaxPlayersExceededException';
    }
}

export class InvalidTournamentStatusUpdateException extends Error {
    constructor() {
        super('Invalid tournament status update');
        this.name = 'InvalidTournamentStatusUpdateException';
    }
}

export class InvalidSeasonStartYearException extends Error {
    constructor() {
        super('Invalid season start year');
        this.name = 'InvalidSeasonStartYearException';
    }
}

export class TournamentAlreadyHasBracketException extends Error {
    constructor() {
        super('Tournament already has a bracket');
        this.name = 'TournamentAlreadyHasBracketException';
    }
}
