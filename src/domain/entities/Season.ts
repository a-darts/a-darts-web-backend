import { InvalidSeasonStartYearException } from "../exceptions/TournamentExceptions.js";

export class Season {
    private readonly startYear: number;

    constructor(startYear: number) {
        if (!startYear || startYear < 1900) {
            throw new InvalidSeasonStartYearException();
        }
        this.startYear = startYear;
    }

    // --------------------------------------------------------------------
    // COMPARISON METHODS
    // --------------------------------------------------------------------
    public equals(other: Season): boolean {
        return this.startYear === other.startYear;
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
        return this.startYear + 1;
    }

    public getFullYear(): string {
        return `${this.startYear}-${this.getEndYear()}`;
    }
}
