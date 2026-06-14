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

export class MatchCancelledEvent implements IDomainEvent {
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
        return 'match.cancelled';
    }
}

export class MatchFinishedEvent implements IDomainEvent {
    public readonly matchId: string;
    public readonly tournamentId: string;
    public readonly occurredOn: Date;

    constructor(matchId: string, tournamentId: string) {
        this.matchId = matchId;
        this.tournamentId = tournamentId;
        this.occurredOn = new Date();
    }

    public getEventName(): string {
        return 'match.finished';
    }
}

export class MatchStartedEvent implements IDomainEvent {
    public readonly matchId: string;
    public readonly occurredOn: Date;

    constructor(matchId: string) {
        this.matchId = matchId;
        this.occurredOn = new Date();
    }

    public getEventName(): string {
        return 'match.started';
    }
}

export class MatchAssignedToBoardEvent implements IDomainEvent {
    public readonly matchId: string;
    public readonly boardShortId: string;
    public readonly occurredOn: Date;

    constructor(matchId: string, boardShortId: string) {
        this.matchId = matchId;
        this.boardShortId = boardShortId;
        this.occurredOn = new Date();
    }

    public getEventName(): string {
        return 'match.assigned.board';
    }
}

export class MatchUnassignedFromBoardEvent implements IDomainEvent {
    public readonly matchId: string;
    public readonly boardShortId: string;
    public readonly occurredOn: Date;

    constructor(matchId: string, boardShortId: string) {
        this.matchId = matchId;
        this.boardShortId = boardShortId;
        this.occurredOn = new Date();
    }

    public getEventName(): string {
        return 'match.unassigned.board';
    }
}
