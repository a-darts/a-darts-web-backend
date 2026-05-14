export class BracketAlreadyExistsException extends Error {
    constructor() {
        super('Bracket already exists');
        this.name = 'BracketAlreadyExistsException';
    }
}

export class BracketNotInDraftOrPublisedException extends Error {
    constructor() {
        super('Bracket not in draft or publised');
        this.name = 'BracketNotInDraftOrPublisedException';
    }
}

export class InvalidPositionsException extends Error {
    constructor() {
        super('Invalid positions');
        this.name = 'InvalidPositionsException';
    }
}
