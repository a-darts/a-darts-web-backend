import { describe, it, expect, beforeEach } from 'vitest';
import { TournamentInfo, GameModes, ScheduleTypes, GameTypes } from "../../../domain/entities/TournamentInfo.js";

describe("TournamentInfo Value Object", () => {
    it("should create a TournamentInfo and return correct values", () => {
        const date = new Date('2024-01-01');
        const info = new TournamentInfo(
            "Madrid",
            date,
            GameModes.SINGLE,
            "501",
            ScheduleTypes.KO,
            64,
            GameTypes.BEST_OF,
            3,
            0,
            "Standard",
            "Extra Info",
            "FED"
        );

        expect(info.getPlace()).toBe("Madrid");
        expect(info.getDateTime()).toBe(date);
        expect(info.getMode()).toBe(GameModes.SINGLE);
        expect(info.getGame()).toBe("501");
        expect(info.getSchedule()).toBe(ScheduleTypes.KO);
        expect(info.getMaxPlayers()).toBe(64);
        expect(info.getGameType()).toBe(GameTypes.BEST_OF);
        expect(info.getNumLegs()).toBe(3);
        expect(info.getNumSets()).toBe(0);
        expect(info.getRules()).toBe("Standard");
        expect(info.getInfo()).toBe("Extra Info");
        expect(info.getFederation()).toBe("FED");
    });

    it("should allow maxPlayers to be null", () => {
        const info = new TournamentInfo(
            "Madrid",
            new Date(),
            GameModes.SINGLE,
            "501",
            ScheduleTypes.KO,
            null,
            GameTypes.BEST_OF,
            3,
            0,
            "",
            "",
            ""
        );

        expect(info.getMaxPlayers()).toBeNull();
    });
});
