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
