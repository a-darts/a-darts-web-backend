import {
    ParticipantAlreadyCheckedInException,
    ParticipantNotCheckedInException,
} from "../exceptions/ParticipantExceptions.js";

export interface IParticipant {
    getId(): string;
    getAlias(): string;
}

export class ByeParticipant implements IParticipant {
    private readonly id: string;

    constructor(
        id: string,
    ) {
        this.id = id;
    }

    public static create(): ByeParticipant {
        return new ByeParticipant(
            crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(7),
        );
    }

    public getId(): string {
        return this.id;
    }

    public getAlias(): string {
        return 'Bye';
    }
}


export class RegisteredParticipant implements IParticipant {
    private readonly id: string;
    private readonly playerId: string;
    private readonly alias: string; // To simplify DB queries
    private readonly registeredAt: Date;
    private checkedInAt: Date | null;

    private readonly tournamentId: string;

    constructor(
        id: string,
        playerId: string,
        alias: string,
        registeredAt: Date,
        checkedInAt: Date | null,
        tournamentId: string,
    ) {
        this.id = id;
        this.playerId = playerId;
        this.alias = alias;
        this.registeredAt = registeredAt;
        this.checkedInAt = checkedInAt;
        this.tournamentId = tournamentId;
    }


    // --------------------------------------------------------------------
    // FACTORY METHOD
    // --------------------------------------------------------------------
    public static create(
        playerId: string,
        alias: string,
        tournamentId: string,
    ): RegisteredParticipant {
        return new RegisteredParticipant(
            crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(7),
            playerId,
            alias,
            new Date(),
            null,
            tournamentId,
        );
    }


    // --------------------------------------------------------------------
    // CHECK IN METHODS
    // --------------------------------------------------------------------
    public doCheckIn() {
        if (this.checkedInAt) {
            throw new ParticipantAlreadyCheckedInException();
        }
        this.checkedInAt = new Date();
    }

    public undoCheckIn() {
        if (!this.checkedInAt) {
            throw new ParticipantNotCheckedInException();
        }
        this.checkedInAt = null;
    }

    public hasDoneCheckIn(): boolean {
        return this.checkedInAt !== null;
    }


    // --------------------------------------------------------------------
    // GETTERS
    // --------------------------------------------------------------------    
    public getId(): string {
        return this.id;
    }

    public getAlias(): string {
        return this.alias;
    }

    public getPlayerId(): string {
        return this.playerId;
    }

    public getRegisteredAt(): Date {
        return this.registeredAt;
    }

    public getCheckedInAt(): Date | null {
        return this.checkedInAt;
    }

    public getTournamentId(): string {
        return this.tournamentId;
    }


    // --------------------------------------------------------------------
    // REHYDRATE METHOD
    // --------------------------------------------------------------------
    static rehydrate(data: any): RegisteredParticipant {
        return new RegisteredParticipant(
            data.id,
            data.playerId,
            data.alias,
            new Date(data.registeredAt),
            data.checkedInAt ? new Date(data.checkedInAt) : null,
            data.tournamentId,
        );
    }
}
