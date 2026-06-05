import { describe, it, expect, beforeEach } from 'vitest';
import { Tournament, TournamentStatus } from "../../../domain/entities/Tournament.js";
import { TournamentInfo, GameModes, ScheduleTypes, GameTypes } from "../../../domain/entities/TournamentInfo.js";
import { Season } from "../../../domain/entities/Season.js";
import { Registration } from "../../../domain/entities/Registration.js";
import { TournamentAlreadyFinishedException, TournamentNotDeletedException, TournamentNotInDraftException, TournamentNotInDraftOrPublishedException, TournamentNotInProgressException, TournamentNotPublishedException } from "../../../domain/exceptions/TournamentExceptions.js";
import { MissingRequiredUserFieldsException } from "../../../domain/exceptions/UserExceptions.js";
import { RegistrationCloseDateAfterTournamentException, RegistrationCloseDateInPastException, RegistrationNotClosedException, RegistrationOpenDateInPastException } from "../../../domain/exceptions/RegistrationExceptions.js";
import { TournamentFinishedEvent, TournamentCancelledEvent } from "../../../domain/events/TournamentEvents.js";

describe("Tournament Entity", () => {
    let info: TournamentInfo;
    let season: Season;

    beforeEach(() => {
        const d = new Date();
        d.setDate(d.getDate() + 10); // future date
        info = new TournamentInfo("Place", d, GameModes.SINGLE, "501", ScheduleTypes.KO, 64, GameTypes.BEST_OF, 3, 0, "", "", "");
        season = new Season(2023);
    });

    it("should create a tournament in draft status", () => {
        const tournament = Tournament.create("My Tournament", season, info, "creatorId");
        expect(tournament.getId()).toBeDefined();
        expect(tournament.getName()).toBe("My Tournament");
        expect(tournament.getStatus()).toBe(TournamentStatus.DRAFT);
        expect(tournament.getSeason().getStartYear()).toBe(2023);
        expect(tournament.getInfo().getPlace()).toBe("Place");
        expect(tournament.getCreatedAt()).toBeInstanceOf(Date);
        expect(tournament.getCreatedBy()).toBe("creatorId");
        expect(tournament.getRegistration()).toBeInstanceOf(Registration);
    });

    it("should throw MissingRequiredUserFieldsException on invalid create", () => {
        expect(() => Tournament.create("", season, info, "creator")).toThrow(MissingRequiredUserFieldsException);
        expect(() => Tournament.create("  ", season, info, "creator")).toThrow(MissingRequiredUserFieldsException);
        expect(() => Tournament.create("Name", season, null as any, "creator")).toThrow(MissingRequiredUserFieldsException);
    });

    it("should update properties", () => {
        const tournament = Tournament.create("My Tournament", season, info, "creatorId");
        tournament.updateName("New Name");
        expect(tournament.getName()).toBe("New Name");

        expect(() => tournament.updateName("   ")).toThrow(MissingRequiredUserFieldsException);

        const newInfo = new TournamentInfo("Place2", new Date(), GameModes.SINGLE, "501", ScheduleTypes.KO, 64, GameTypes.BEST_OF, 3, 0, "", "", "");
        tournament.updateInfo(newInfo);
        expect(tournament.getInfo().getPlace()).toBe("Place2");

        const newSeason = new Season(2024);
        tournament.updateSeason(newSeason);
        expect(tournament.getSeason().getStartYear()).toBe(2024);
    });

    it("should manage publishing", () => {
        const tournament = Tournament.create("My Tournament", season, info, "creatorId");

        expect(() => tournament.unpublish()).toThrow(TournamentNotPublishedException);

        tournament.publish();
        expect(tournament.getStatus()).toBe(TournamentStatus.PUBLISHED);

        expect(() => tournament.publish()).toThrow(TournamentNotInDraftException);

        tournament.unpublish();
        expect(tournament.getStatus()).toBe(TournamentStatus.DRAFT);
    });

    it("should manage starting and finishing", () => {
        const tournament = Tournament.create("My Tournament", season, info, "creatorId");
        expect(() => tournament.start()).toThrow(TournamentNotPublishedException);
        expect(() => tournament.finish()).toThrow(TournamentNotInProgressException);

        tournament.publish();
        tournament.start();
        expect(tournament.getStatus()).toBe(TournamentStatus.IN_PROGRESS);

        tournament.finish();
        expect(tournament.getStatus()).toBe(TournamentStatus.FINISHED);

        const events = tournament.pullEvents();
        expect(events.length).toBe(1);
        expect(events[0]).toBeInstanceOf(TournamentFinishedEvent);
    });

    it("should not start if registration is open", () => {
        const tournament = Tournament.create("My Tournament", season, info, "creatorId");
        tournament.publish();
        tournament.openRegistration();
        expect(() => tournament.start()).toThrow(RegistrationNotClosedException);
    });

    it("should manage cancelling", () => {
        const tournament = Tournament.create("My Tournament", season, info, "creatorId");
        tournament.cancel();
        expect(tournament.getStatus()).toBe(TournamentStatus.CANCELLED);
        const events = tournament.pullEvents();
        expect(events.length).toBe(1);
        expect(events[0]).toBeInstanceOf(TournamentCancelledEvent);

        expect(() => tournament.cancel()).not.toThrow(); // Cancel again works unless finished

        const t2 = Tournament.create("My Tournament", season, info, "creatorId");
        t2.publish();
        t2.start();
        t2.finish();
        expect(() => t2.cancel()).toThrow(TournamentAlreadyFinishedException);
    });

    it("should manage deletion and restoration", () => {
        const tournament = Tournament.create("My Tournament", season, info, "creatorId");
        tournament.delete();
        expect(tournament.getStatus()).toBe(TournamentStatus.DELETED);

        expect(() => tournament.delete()).toThrow(TournamentNotInDraftOrPublishedException);

        tournament.restore();
        expect(tournament.getStatus()).toBe(TournamentStatus.DRAFT);
        expect(() => tournament.restore()).toThrow(TournamentNotDeletedException);

        expect(() => tournament.start()).toThrow();
    });

    it("should manage isDelayed", () => {
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 1);
        const pastInfo = new TournamentInfo("Place", pastDate, GameModes.SINGLE, "501", ScheduleTypes.KO, 64, GameTypes.BEST_OF, 3, 0, "", "", "");
        const tournament = Tournament.create("My Tournament", season, pastInfo, "creatorId");
        expect(tournament.isDelayed()).toBe(true);

        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 1);
        const futureInfo = new TournamentInfo("Place", futureDate, GameModes.SINGLE, "501", ScheduleTypes.KO, 64, GameTypes.BEST_OF, 3, 0, "", "", "");
        tournament.updateInfo(futureInfo);
        expect(tournament.isDelayed()).toBe(false);

        tournament.cancel();
        expect(tournament.isDelayed()).toBe(false);
    });

    it("should manage registration state", () => {
        const tournament = Tournament.create("My Tournament", season, info, "creatorId");

        expect(tournament.isRegistrationClosed()).toBe(true);
        expect(tournament.isRegistrationOpen()).toBe(false);

        tournament.openRegistration();
        expect(tournament.isRegistrationOpen()).toBe(true);

        tournament.closeRegistration();
        expect(tournament.isRegistrationClosed()).toBe(true);

        tournament.enableCheckIn();
        expect(tournament.getRegistration().getHasCheckIn()).toBe(true);

        tournament.disableCheckIn();
        expect(tournament.getRegistration().getHasCheckIn()).toBe(false);
    });

    it("should manage registration scheduling", () => {
        const tournament = Tournament.create("My Tournament", season, info, "creatorId");

        expect(() => tournament.scheduleRegistration(null, null)).toThrow(TournamentNotPublishedException);

        tournament.publish();

        const open = new Date(); open.setHours(open.getHours() + 1);
        const close = new Date(); close.setDate(close.getDate() + 5);

        tournament.scheduleRegistration(open, close);
        expect(tournament.getRegistration().getRegistrationPeriod().getStartsAt()?.getTime()).toBe(open.getTime());

        // Error cases
        const past = new Date(); past.setHours(past.getHours() - 1);
        expect(() => tournament.scheduleRegistration(past, null)).toThrow(RegistrationOpenDateInPastException);
        expect(() => tournament.scheduleRegistration(null, past)).toThrow(RegistrationCloseDateInPastException);

        const afterTourn = new Date(); afterTourn.setDate(afterTourn.getDate() + 20);
        expect(() => tournament.scheduleRegistration(null, afterTourn)).toThrow(RegistrationCloseDateAfterTournamentException);
    });

    it("should rehydrate", () => {
        const data = {
            id: "t1",
            name: "Tourn",
            seasonStartYear: 2024,
            createdAt: new Date(),
            createdBy: "admin",
            status: TournamentStatus.IN_PROGRESS,
            info: {
                place: "A",
                dateTime: new Date(),
                mode: GameModes.SINGLE,
                game: "501",
                schedule: ScheduleTypes.KO,
                maxPlayers: 32,
                gameType: GameTypes.BEST_OF,
                numLegs: 3,
                numSets: 0,
                rules: "R",
                info: "I",
                federation: "F"
            },
            registration: {
                hasCheckIn: true,
                status: "OPEN",
                registrationPeriod: {
                    startsAt: new Date(),
                    endsAt: null
                }
            }
        };

        const tournament = Tournament.rehydrate(data);
        expect(tournament.getId()).toBe("t1");
        expect(tournament.getName()).toBe("Tourn");
        expect(tournament.getStatus()).toBe(TournamentStatus.IN_PROGRESS);
        expect(tournament.isRegistrationOpen()).toBe(true);
        expect(tournament.getRegistration().getHasCheckIn()).toBe(true);
    });
});
