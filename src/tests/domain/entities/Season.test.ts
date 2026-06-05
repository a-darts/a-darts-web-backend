import { describe, it, expect, beforeEach } from 'vitest';
import { Season } from "../../../domain/entities/Season.js";
import { InvalidSeasonStartYearException } from "../../../domain/exceptions/TournamentExceptions.js";

describe("Season Entity", () => {
    it("should create a season with valid start year", () => {
        const season = new Season(2023);
        expect(season.getStartYear()).toBe(2023);
        expect(season.getEndYear()).toBe(2024);
        expect(season.getFullYear()).toBe("2023-2024");
    });

    it("should throw an exception when start year is less than 1900", () => {
        expect(() => new Season(1899)).toThrow(InvalidSeasonStartYearException);
    });

    it("should throw an exception when start year is falsy", () => {
        expect(() => new Season(0)).toThrow(InvalidSeasonStartYearException);
    });

    it("should compare equal seasons correctly", () => {
        const season1 = new Season(2023);
        const season2 = new Season(2023);
        expect(season1.equals(season2)).toBe(true);
    });

    it("should compare non-equal seasons correctly", () => {
        const season1 = new Season(2023);
        const season2 = new Season(2024);
        expect(season1.equals(season2)).toBe(false);
    });

    it("should correctly identify if a season is after another", () => {
        const season1 = new Season(2024);
        const season2 = new Season(2023);
        expect(season1.isAfter(season2)).toBe(true);
        expect(season2.isAfter(season1)).toBe(false);
    });
});
