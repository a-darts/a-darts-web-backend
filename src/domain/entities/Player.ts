import { PlayerAlreadyDeletedException, PlayerNotDeletedException } from "../exceptions/PlayerExceptions.js";
import { MissingRequiredUserFieldsException } from "../exceptions/UserExceptions.js";
import { Season } from "./Season.js";


export enum PlayerStatus {
    ACTIVE = 'ACTIVE',
    DELETED = 'DELETED',
}


export class Player {
    private readonly id: string;
    private readonly userId: string;
    private registrationNumber: string;
    private federation: string;
    private season: Season;

    private deletedAt?: Date | null;
    private status: PlayerStatus;

    constructor(
        id: string,
        userId: string,
        registrationNumber: string,
        federation: string,
        season: Season,
        deletedAt: Date | null,
        status: PlayerStatus,
    ) {
        this.id = id;
        this.userId = userId;
        this.registrationNumber = registrationNumber;
        this.federation = federation;
        this.season = season;
        this.deletedAt = deletedAt;
        this.status = status;
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
            null,
            PlayerStatus.ACTIVE,
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
    // STATUS MANAGEMENT
    // --------------------------------------------------------------------
    public delete(): void {
        if (this.status === PlayerStatus.DELETED) {
            throw new PlayerAlreadyDeletedException();
        }
        this.status = PlayerStatus.DELETED;
        this.deletedAt = new Date();
    }

    public restore(): void {
        if (this.status !== PlayerStatus.DELETED) {
            throw new PlayerNotDeletedException();
        }
        this.status = PlayerStatus.ACTIVE;
        this.deletedAt = null;
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

    public getDeletedAt(): Date | null | undefined {
        return this.deletedAt;
    }

    public getStatus(): PlayerStatus {
        return this.status;
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
            data.deletedAt,
            data.status,
        );
    }
}
