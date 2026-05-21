import { IDomainEvent } from "./IDomainEvent.js";

export class BracketFinishedEvent implements IDomainEvent {
    public readonly bracketId: string;
    public readonly tournamentId: string;
    public readonly occurredOn: Date;

    constructor(
        bracketId: string,
        tournamentId: string
    ) {
        this.bracketId = bracketId;
        this.tournamentId = tournamentId;
        this.occurredOn = new Date();
    }

    public getEventName(): string {
        return 'tournament.bracket.finished';
    }
}
