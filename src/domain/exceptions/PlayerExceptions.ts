export class PlayerNotFoundException extends Error {
    constructor() {
        super('Player not found');
        this.name = 'PlayerNotFoundException';
    }
}

export class PlayerAlreadyExistsException extends Error {
    constructor() {
        super('Player already exists in that season');
        this.name = 'PlayerAlreadyExistsException';
    }
}

export class PlayerAlreadyDeletedException extends Error {
    constructor() {
        super('Player is already deleted');
        this.name = 'PlayerAlreadyDeletedException';
    }
}

export class PlayerNotDeletedException extends Error {
    constructor() {
        super('Player is not deleted');
        this.name = 'PlayerNotDeletedException';
    }
}

export class InvalidRegisteredPlayerSeasonException extends Error {
    constructor() {
        super('Player is not registered in the same season as the tournament');
        this.name = 'InvalidRegisteredPlayerSeasonException';
    }
}

export class InvalidYearException extends Error {
    constructor() {
        super('Invalid year. It must be between 1900 and 2200');
        this.name = 'InvalidYearException';
    }
}

export class InvalidSeasonException extends Error {
    constructor() {
        super('Invalid season. It must span exactly one year');
        this.name = 'InvalidSeasonException';
    }
}
