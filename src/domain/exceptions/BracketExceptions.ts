export class BracketAlreadyExistsException extends Error {
    constructor() {
        super('Bracket already exists');
        this.name = 'BracketAlreadyExistsException';
    }
}
