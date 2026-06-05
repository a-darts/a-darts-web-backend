import { describe, it, expect } from 'vitest';
import { EmptyParticipant, ByeParticipant, RegisteredParticipant, ParticipantTypes } from "../../../domain/entities/Participant.js";
import { ParticipantAlreadyCheckedInException, ParticipantNotCheckedInException } from "../../../domain/exceptions/ParticipantExceptions.js";

describe("Participant Entities", () => {
    describe("EmptyParticipant", () => {
        it("should create and return default values", () => {
            const participant = EmptyParticipant.create();
            expect(participant.getId()).toBeDefined();
            expect(participant.getAlias()).toBe("Por determinar");
            expect(participant.getFederation()).toBe("N/A");
        });
    });

    describe("ByeParticipant", () => {
        it("should create and return default values", () => {
            const participant = ByeParticipant.create();
            expect(participant.getId()).toBeDefined();
            expect(participant.getAlias()).toBe("Bye");
            expect(participant.getFederation()).toBe("N/A");
        });
    });

    describe("RegisteredParticipant", () => {
        it("should create a registered participant", () => {
            const participant = RegisteredParticipant.create("player1", "tourn1", "Alias", "FED");
            expect(participant.getId()).toBeDefined();
            expect(participant.getPlayerId()).toBe("player1");
            expect(participant.getTournamentId()).toBe("tourn1");
            expect(participant.getAlias()).toBe("Alias");
            expect(participant.getFederation()).toBe("FED");
            expect(participant.hasDoneCheckIn()).toBe(false);
            expect(participant.getCheckedInAt()).toBeNull();
            expect(participant.getRegisteredAt()).toBeInstanceOf(Date);
        });

        it("should allow check-in", () => {
            const participant = RegisteredParticipant.create("player1", "tourn1", "Alias", "FED");
            participant.doCheckIn();
            expect(participant.hasDoneCheckIn()).toBe(true);
            expect(participant.getCheckedInAt()).not.toBeNull();
        });

        it("should throw exception if already checked in", () => {
            const participant = RegisteredParticipant.create("player1", "tourn1", "Alias", "FED");
            participant.doCheckIn();
            expect(() => participant.doCheckIn()).toThrow(ParticipantAlreadyCheckedInException);
        });

        it("should allow undo check-in", () => {
            const participant = RegisteredParticipant.create("player1", "tourn1", "Alias", "FED");
            participant.doCheckIn();
            participant.undoCheckIn();
            expect(participant.hasDoneCheckIn()).toBe(false);
            expect(participant.getCheckedInAt()).toBeNull();
        });

        it("should throw exception if undoing check-in when not checked in", () => {
            const participant = RegisteredParticipant.create("player1", "tourn1", "Alias", "FED");
            expect(() => participant.undoCheckIn()).toThrow(ParticipantNotCheckedInException);
        });

        it("should rehydrate", () => {
            const data = {
                id: "part1",
                playerId: "player1",
                registeredAt: new Date(),
                checkedInAt: new Date(),
                tournamentId: "tourn1",
                alias: "alias",
                federation: "fed"
            };
            const participant = RegisteredParticipant.rehydrate(data);
            expect(participant.getId()).toBe("part1");
            expect(participant.getPlayerId()).toBe("player1");
            expect(participant.getRegisteredAt()).toBeInstanceOf(Date);
            expect(participant.getCheckedInAt()).toBeInstanceOf(Date);
            expect(participant.getTournamentId()).toBe("tourn1");
            expect(participant.getAlias()).toBe("alias");
            expect(participant.getFederation()).toBe("fed");
            
            const dataNotCheckedIn = { ...data, checkedInAt: null };
            const p2 = RegisteredParticipant.rehydrate(dataNotCheckedIn);
            expect(p2.getCheckedInAt()).toBeNull();
        });
    });

    it("should export ParticipantTypes enum", () => {
        expect(ParticipantTypes.REGISTERED).toBe('REGISTERED');
        expect(ParticipantTypes.BYE).toBe('BYE');
        expect(ParticipantTypes.EMPTY).toBe('EMPTY');
    });
});
