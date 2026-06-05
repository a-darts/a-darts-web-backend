import { describe, it, expect, beforeEach } from 'vitest';
import { Player, PlayerStatus } from "../../../domain/entities/Player.js";
import { Season } from "../../../domain/entities/Season.js";
import { PlayerAlreadyDeletedException, PlayerNotDeletedException } from "../../../domain/exceptions/PlayerExceptions.js";
import { MissingRequiredUserFieldsException } from "../../../domain/exceptions/UserExceptions.js";

describe("Player Entity", () => {
    describe("Factory Methods", () => {
        it("should create a player", () => {
            const season = new Season(2023);
            const player = Player.create("userId1", "REG123", "FED", season);
            expect(player.getId()).toBeDefined();
            expect(player.getUserId()).toBe("userId1");
            expect(player.getRegistrationNumber()).toBe("REG123");
            expect(player.getFederation()).toBe("FED");
            expect(player.getSeason().getStartYear()).toBe(2023);
            expect(player.getStatus()).toBe(PlayerStatus.ACTIVE);
            expect(player.getDeletedAt()).toBeNull();
        });

        it("should throw MissingRequiredUserFieldsException for invalid data", () => {
            const season = new Season(2023);
            expect(() => Player.create("", "REG123", "FED", season)).toThrow(MissingRequiredUserFieldsException);
            expect(() => Player.create("user", "", "FED", season)).toThrow(MissingRequiredUserFieldsException);
            expect(() => Player.create("user", "REG123", "", season)).toThrow(MissingRequiredUserFieldsException);
            expect(() => Player.create("user", "REG123", "FED", null as any)).toThrow(MissingRequiredUserFieldsException);
            
            expect(() => Player.create("   ", "REG123", "FED", season)).toThrow(MissingRequiredUserFieldsException);
            expect(() => Player.create("user", "   ", "FED", season)).toThrow(MissingRequiredUserFieldsException);
            expect(() => Player.create("user", "REG123", "   ", season)).toThrow(MissingRequiredUserFieldsException);
        });
    });

    describe("Update Methods", () => {
        it("should update federation", () => {
            const season = new Season(2023);
            const player = Player.create("userId1", "REG123", "FED", season);
            player.updateFederation("NEW_FED");
            expect(player.getFederation()).toBe("NEW_FED");
        });

        it("should throw exception when updating federation with invalid value", () => {
            const season = new Season(2023);
            const player = Player.create("userId1", "REG123", "FED", season);
            expect(() => player.updateFederation("")).toThrow(MissingRequiredUserFieldsException);
            expect(() => player.updateFederation("   ")).toThrow(MissingRequiredUserFieldsException);
        });
    });

    describe("Status Management", () => {
        let player: Player;
        beforeEach(() => {
            const season = new Season(2023);
            player = Player.create("userId1", "REG123", "FED", season);
        });

        it("should delete player", () => {
            player.delete();
            expect(player.getStatus()).toBe(PlayerStatus.DELETED);
            expect(player.getDeletedAt()).not.toBeNull();
        });

        it("should throw exception if already deleted", () => {
            player.delete();
            expect(() => player.delete()).toThrow(PlayerAlreadyDeletedException);
        });

        it("should restore a deleted player", () => {
            player.delete();
            player.restore();
            expect(player.getStatus()).toBe(PlayerStatus.ACTIVE);
            expect(player.getDeletedAt()).toBeNull();
        });

        it("should throw exception if restoring a non-deleted player", () => {
            expect(() => player.restore()).toThrow(PlayerNotDeletedException);
        });
    });

    describe("Rehydrate", () => {
        it("should rehydrate", () => {
            const data = {
                id: "player1",
                userId: "user1",
                registrationNumber: "REG1",
                federation: "FED1",
                seasonStartYear: 2024,
                deletedAt: null,
                status: PlayerStatus.ACTIVE
            };
            const player = Player.rehydrate(data);
            expect(player.getId()).toBe("player1");
            expect(player.getUserId()).toBe("user1");
            expect(player.getRegistrationNumber()).toBe("REG1");
            expect(player.getFederation()).toBe("FED1");
            expect(player.getSeason().getStartYear()).toBe(2024);
            expect(player.getDeletedAt()).toBeNull();
            expect(player.getStatus()).toBe(PlayerStatus.ACTIVE);
        });
    });
});
