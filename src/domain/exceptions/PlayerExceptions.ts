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
