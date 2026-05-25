export class BracketNotFoundException extends Error {
    constructor() {
        super('Bracket not found');
        this.name = 'BracketNotFoundException';
    }
}

export class BracketAlreadyExistsException extends Error {
    constructor() {
        super('Bracket already exists');
        this.name = 'BracketAlreadyExistsException';
    }
}

export class BracketNotInDraftOrPublisedException extends Error {
    constructor() {
        super('Bracket not in draft or published');
        this.name = 'BracketNotInDraftOrPublisedException';
    }
}

export class BracketNotInDraftException extends Error {
    constructor() {
        super('Bracket not in draft');
        this.name = 'BracketNotInDraftException';
    }
}

export class BracketNotInProgressException extends Error {
    constructor() {
        super('Bracket not in progress');
        this.name = 'BracketNotInProgressException';
    }
}

export class BracketInProgressException extends Error {
    constructor() {
        super('Bracket in progress');
        this.name = 'BracketInProgressException';
    }
}

export class BracketNotPublishedException extends Error {
    constructor() {
        super('Bracket not published');
        this.name = 'BracketNotPublishedException';
    }
}

export class BracketAlreadyFinishedException extends Error {
    constructor() {
        super('Bracket already finished');
        this.name = 'BracketAlreadyFinishedException';
    }
}

export class InvalidPositionsException extends Error {
    constructor() {
        super('Invalid positions');
        this.name = 'InvalidPositionsException';
    }
}

export class DuplicateParticipantsException extends Error {
    constructor() {
        super('Duplicate participants in bracket');
        this.name = 'DuplicateParticipantsException';
    }
}

export class BracketUnfinishedException extends Error {
    constructor() {
        super('Bracket is not completely finished or filled');
        this.name = 'BracketUnfinishedException';
    }
}

