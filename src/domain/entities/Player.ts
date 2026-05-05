export class Season {
    private readonly startYear: number;
    private readonly endYear: number;

    constructor(startYear: number, endYear: number) {
        this.startYear = startYear;
        this.endYear = endYear;
        this.validate();
    }

    private validate(): void {
        if (
            this.startYear < 1900 || this.startYear > 2200 ||
            this.endYear < 1900 || this.endYear > 2200
        ) {
            throw new Error('Invalid year');
        }
        if (this.startYear + 1 !== this.endYear) {
            throw new Error('Invalid season: startYear must be 1 year before endYear');
        }
    }


    // --------------------------------------------------------------------
    // COMPARISON METHODS
    // --------------------------------------------------------------------
    public equals(other: Season): boolean {
        return this.startYear === other.startYear && this.endYear === other.endYear;
    }

    public isAfter(other: Season): boolean {
        return this.startYear > other.startYear;
    }


    // --------------------------------------------------------------------
    // GETTERS
    // --------------------------------------------------------------------
    public getStartYear(): number {
        return this.startYear;
    }

    public getEndYear(): number {
        return this.endYear;
    }

    public toString(): string {
        return `${this.startYear}-${this.endYear}`;
    }
}


export class Player {
    private readonly userId: string;
    private registrationNumber: string;
    private federation: string;
    private season: Season;

    constructor(
        userId: string,
        registrationNumber: string,
        federation: string,
        season: Season,
    ) {
        this.userId = userId;
        this.registrationNumber = registrationNumber;
        this.federation = federation;
        this.season = season;
    }


    // --------------------------------------------------------------------
    // GETTERS
    // --------------------------------------------------------------------
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
}
