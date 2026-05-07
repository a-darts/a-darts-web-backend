export type GameModes = 'single' | 'women_singles' | 'men_singles' | 'mixes_singles' | 'youth_singles' | 'pairs' | 'women_pairs' | 'men_pairs' | 'mixed_pairs' | 'youth_pairs' | 'teams';
export type ScheduleTypes = 'K.O.';
export type GameTypes = 'best_of' | 'first_to';


export class TournamentInfo {
    private readonly place: string;
    private readonly dateTime: Date;
    private readonly mode: GameModes;
    private readonly game: string;
    private readonly schedule: ScheduleTypes;
    private readonly maxPlayers: number;
    private readonly typeOfGame: GameTypes;
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
        maxPlayers: number,
        typeOfGame: GameTypes,
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
        this.typeOfGame = typeOfGame;
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

    public getMaxPlayers(): number {
        return this.maxPlayers;
    }

    public getTypeOfGame(): GameTypes {
        return this.typeOfGame;
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
