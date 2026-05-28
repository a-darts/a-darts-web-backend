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

export class MatchFinishedEvent implements IDomainEvent {
    public readonly matchId: string;
    public readonly boardNumber: number | null;
    public readonly tournamentId: string;
    public readonly occurredOn: Date;

    constructor(matchId: string, boardNumber: number | null, tournamentId: string) {
        this.matchId = matchId;
        this.boardNumber = boardNumber;
        this.tournamentId = tournamentId;
        this.occurredOn = new Date();
    }

    public getEventName(): string {
        return 'match.finished';
    }
}
