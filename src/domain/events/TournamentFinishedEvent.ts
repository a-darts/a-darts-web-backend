import { IDomainEvent } from "./IDomainEvent.js";

export class TournamentFinishedEvent implements IDomainEvent {
    public readonly tournamentId: string;
    public readonly occurredOn: Date;

    constructor(tournamentId: string) {
        this.tournamentId = tournamentId;
        this.occurredOn = new Date();
    }

    public getEventName(): string {
        return 'tournament.finished';
    }
}
