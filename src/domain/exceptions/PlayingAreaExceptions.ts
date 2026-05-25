export class PlayingAreaNotFoundException extends Error {
    constructor() {
        super('Playing area not found');
        this.name = 'PlayingAreaNotFoundException';
    }
}

export class PlayingAreaAlreadyExistsException extends Error {
    constructor() {
        super('Playing area already exists');
        this.name = 'PlayingAreaAlreadyExistsException';
    }
}

export class PlayingAreaHasNoBoardsException extends Error {
    constructor() {
        super('Playing area has no boards');
        this.name = 'PlayingAreaHasNoBoardsException';
    }
}

export class BoardOccupiedException extends Error {
    constructor() {
        super('Board is occupied');
        this.name = 'BoardOccupiedException';
    }
}

export class BoardNotFoundException extends Error {
    constructor() {
        super('Board not found');
        this.name = 'BoardNotFoundException';
    }
}

export class BoardAlreadyOccupiedException extends Error {
    constructor() {
        super('Board is already occupied');
        this.name = 'BoardAlreadyOccupiedException';
    }
}

export class BoardDisabledException extends Error {
    constructor() {
        super('Board is disabled');
        this.name = 'BoardDisabledException';
    }
}

export class BoardNotOccupiedException extends Error {
    constructor() {
        super('Board is not occupied');
        this.name = 'BoardNotOccupiedException';
    }
}

export class BoardNotAvailableException extends Error {
    constructor() {
        super('Board is not available');
        this.name = 'BoardNotAvailableException';
    }
}

export class BoardNotDisabledException extends Error {
    constructor() {
        super('Board is not disabled');
        this.name = 'BoardNotDisabledException';
    }
}

export class MatchAlreadyAssignedToBoardException extends Error {
    constructor() {
        super('Match is already assigned to a board');
        this.name = 'MatchAlreadyAssignedToBoardException';
    }
}

export class BoardPairedWithTabletException extends Error {
    constructor() {
        super('Board is already paired with a tablet');
        this.name = 'BoardPairedWithTabletException';
    }
}
