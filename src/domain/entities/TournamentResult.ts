export class TournamentResult {
    private readonly id: string;
    private readonly tournamentId: string;
    private readonly participantId: string;
    private readonly playerId: string;
    
    private readonly finalPosition: number;
    
    private readonly matchesWon: number;
    private readonly matchesLost: number;
    private readonly setsWon: number;
    private readonly setsLost: number;
    private readonly legsWon: number;
    private readonly legsLost: number;

    constructor(
        id: string,
        tournamentId: string,
        participantId: string,
        playerId: string,
        finalPosition: number,
        matchesWon: number,
        matchesLost: number,
        setsWon: number,
        setsLost: number,
        legsWon: number,
        legsLost: number,
    ) {
        this.id = id;
        this.tournamentId = tournamentId;
        this.participantId = participantId;
        this.playerId = playerId;
        this.finalPosition = finalPosition;
        this.matchesWon = matchesWon;
        this.matchesLost = matchesLost;
        this.setsWon = setsWon;
        this.setsLost = setsLost;
        this.legsWon = legsWon;
        this.legsLost = legsLost;
    }

    
    // --------------------------------------------------------------------
    // FACTORY METHOD
    // --------------------------------------------------------------------
    public static create(
        tournamentId: string,
        participantId: string,
        playerId: string,
        finalPosition: number,
        matchesWon: number,
        matchesLost: number,
        setsWon: number,
        setsLost: number,
        legsWon: number,
        legsLost: number,
    ): TournamentResult {
        return new TournamentResult(
            crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(7),
            tournamentId,
            participantId,
            playerId,
            finalPosition,
            matchesWon,
            matchesLost,
            setsWon,
            setsLost,
            legsWon,
            legsLost,
        );
    }

    
    // --------------------------------------------------------------------
    // GETTERS
    // --------------------------------------------------------------------
    public getId(): string {
        return this.id;
    }

    public getTournamentId(): string {
        return this.tournamentId;
    }

    public getParticipantId(): string {
        return this.participantId;
    }

    public getPlayerId(): string {
        return this.playerId;
    }

    public getFinalPosition(): number {
        return this.finalPosition;
    }

    public getMatchesWon(): number {
        return this.matchesWon;
    }

    public getMatchesLost(): number {
        return this.matchesLost;
    }

    public getSetsWon(): number {
        return this.setsWon;
    }

    public getSetsLost(): number {
        return this.setsLost;
    }

    public getLegsWon(): number {
        return this.legsWon;
    }

    public getLegsLost(): number {
        return this.legsLost;
    }

    
    // --------------------------------------------------------------------
    // REHYDRATE METHOD
    // --------------------------------------------------------------------
    static rehydrate(data: any): TournamentResult {
        return new TournamentResult(
            data.id,
            data.tournamentId,
            data.participantId,
            data.playerId,
            data.finalPosition,
            data.matchesWon,
            data.matchesLost,
            data.setsWon,
            data.setsLost,
            data.legsWon,
            data.legsLost,
        );
    }
}
