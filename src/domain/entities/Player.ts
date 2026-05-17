import { InvalidSeasonException, InvalidYearException } from "../exceptions/PlayerExceptions.js";
import { MissingRequiredUserFieldsException } from "../exceptions/UserExceptions.js";
import { Season } from "./Season.js";


export class Player {
    private readonly id: string;
    private readonly userId: string;
    private registrationNumber: string;
    private federation: string;
    private season: Season;

    constructor(
        id: string,
        userId: string,
        registrationNumber: string,
        federation: string,
        season: Season,
    ) {
        this.id = id;
        this.userId = userId;
        this.registrationNumber = registrationNumber;
        this.federation = federation;
        this.season = season;
    }


    // --------------------------------------------------------------------
    // FACTORY METHOD
    // --------------------------------------------------------------------
    public static create(
        userId: string,
        registrationNumber: string,
        federation: string,
        season: Season,
    ): Player {
        if (
            !userId || !registrationNumber || !federation || !season ||
            userId.trim() === '' || registrationNumber.trim() === '' || federation.trim() === ''
        ) {
            throw new MissingRequiredUserFieldsException();
        }

        return new Player(
            crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(7),
            userId,
            registrationNumber,
            federation,
            season,
        );
    }


    // --------------------------------------------------------------------
    // UPDATE METHODS
    // --------------------------------------------------------------------
    public updateFederation(newFederation: string): void {
        if (!newFederation || newFederation.trim() === '') {
            throw new MissingRequiredUserFieldsException();
        }
        this.federation = newFederation;
    }


    // --------------------------------------------------------------------
    // GETTERS
    // --------------------------------------------------------------------
    public getId(): string {
        return this.id;
    }

    public getUserId(): string {
        return this.userId;
    }

    public getRegistrationNumber(): string {
        return this.registrationNumber;
    }

    public getFederation(): string {
        return this.federation;
    }

    public getSeason(): Season {
        return this.season;
    }


    // --------------------------------------------------------------------
    // REHYDRATE METHOD
    // --------------------------------------------------------------------
    static rehydrate(data: any): Player {
        return new Player(
            data.id,
            data.userId,
            data.registrationNumber,
            data.federation,
            new Season(data.seasonStartYear),
        );
    }
}
