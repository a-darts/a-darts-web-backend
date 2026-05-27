import { IDomainEvent } from "./IDomainEvent.js";

export class MatchSuspendedEvent implements IDomainEvent {
    public readonly matchId: string;
    public readonly boardShortId: string;
    public readonly occurredOn: Date;

    constructor(
        matchId: string,
        boardShortId: string,
    ) {
        this.matchId = matchId;
        this.boardShortId = boardShortId;
        this.occurredOn = new Date();
    }

    public getEventName(): string {
        return 'match.suspended';
    }
}

export class MatchResumedEvent implements IDomainEvent {
    public readonly matchId: string;
    public readonly boardShortId: string;
    public readonly occurredOn: Date;

    constructor(
        matchId: string,
        boardShortId: string,
    ) {
        this.matchId = matchId;
        this.boardShortId = boardShortId;
        this.occurredOn = new Date();
    }

    public getEventName(): string {
        return 'match.resumed';
    }
}
