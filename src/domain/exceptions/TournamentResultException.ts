export class TournamentResultNotFoundException extends Error {
    constructor() {
        super('Tournament result not found');
        this.name = 'TournamentResultNotFoundException';
    }
}
