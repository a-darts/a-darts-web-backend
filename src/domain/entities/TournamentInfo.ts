export enum GameModes {
    SINGLE = 'SINGLE',
    WOMEN_SINGLES = 'WOMEN_SINGLES',
    MEN_SINGLES = 'MEN_SINGLES',
    MIXED_SINGLES = 'MIXED_SINGLES',
    YOUTH_SINGLES = 'YOUTH_SINGLES',
    PAIRS = 'PAIRS',
    WOMEN_PAIRS = 'WOMEN_PAIRS',
    MEN_PAIRS = 'MEN_PAIRS',
    MIXED_PAIRS = 'MIXED_PAIRS',
    YOUTH_PAIRS = 'YOUTH_PAIRS',
    TEAMS = 'TEAMS',
}

export enum ScheduleTypes {
    KO = 'KO',
}

export enum GameTypes {
    BEST_OF = 'BEST_OF',
    FIRST_TO = 'FIRST_TO',
}


export class TournamentInfo {
    private readonly place: string;
    private readonly dateTime: Date;
    private readonly mode: GameModes;
    private readonly game: string;
    private readonly schedule: ScheduleTypes;
    private readonly maxPlayers: number | null;
    private readonly gameType: GameTypes;
    private readonly numLegs: number;
    private readonly numSets: number;
    private readonly rules: string;
    private readonly info: string;
    private readonly federation: string;


    constructor(
        place: string,
        dateTime: Date,
        mode: GameModes,
        game: string,
        schedule: ScheduleTypes,
        maxPlayers: number | null,
        gameType: GameTypes,
        numLegs: number,
        numSets: number,
        rules: string,
        info: string,
        federation: string,
    ) {
        this.place = place;
        this.dateTime = dateTime;
        this.mode = mode;
        this.game = game;
        this.schedule = schedule;
        this.maxPlayers = maxPlayers;
        this.gameType = gameType;
        this.numLegs = numLegs;
        this.numSets = numSets;
        this.rules = rules;
        this.info = info;
        this.federation = federation;
    }


    // --------------------------------------------------------------------
    // GETTERS
    // --------------------------------------------------------------------
    public getPlace(): string {
        return this.place;
    }

    public getDateTime(): Date {
        return this.dateTime;
    }

    public getMode(): GameModes {
        return this.mode;
    }

    public getGame(): string {
        return this.game;
    }

    public getSchedule(): ScheduleTypes {
        return this.schedule;
    }

    public getMaxPlayers(): number | null {
        return this.maxPlayers;
    }

    public getGameType(): GameTypes {
        return this.gameType;
    }

    public getNumLegs(): number {
        return this.numLegs;
    }

    public getNumSets(): number {
        return this.numSets;
    }

    public getRules(): string {
        return this.rules;
    }

    public getInfo(): string {
        return this.info;
    }

    public getFederation(): string {
        return this.federation;
    }
}
