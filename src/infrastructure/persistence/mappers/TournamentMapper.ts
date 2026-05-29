import {
    Tournament as PrismaTournament,
    RegistrationStatus as PrismaRegistrationStatus,
    TournamentStatus as PrismaTournamentStatus,
    GameModes as PrismaGameModes,
    ScheduleTypes as PrismaScheduleTypes,
    GameTypes as PrismaGameTypes,
} from '@prisma/client';
import {
    Tournament,
    TournamentStatus,
} from '../../../domain/entities/Tournament.js';
import {
    GameModes,
    ScheduleTypes,
    GameTypes,
} from '../../../domain/entities/TournamentInfo.js';
import { RegistrationStatus } from '../../../domain/entities/Registration.js';

export class TournamentMapper {
    // From Domain Entity to Prisma Object
    static toPersistence(tournament: Tournament) {
        const info = tournament.getInfo();
        const registration = tournament.getRegistration();

        const tournamentData = {
            id: tournament.getId(),
            name: tournament.getName(),
            seasonStartYear: tournament.getSeason().getStartYear(),
            createdAt: tournament.getCreatedAt(),
            createdBy: tournament.getCreatedBy(),
            status: tournament.getStatus() as PrismaTournamentStatus,

            // TournamentInfo fields
            infoPlace: info.getPlace(),
            infoDateTime: info.getDateTime(),
            infoMode: info.getMode() as PrismaGameModes,
            infoGame: info.getGame(),
            infoSchedule: info.getSchedule() as PrismaScheduleTypes,
            infoMaxPlayers: info.getMaxPlayers(),
            infoGameType: info.getGameType() as PrismaGameTypes,
            infoNumLegs: info.getNumLegs(),
            infoNumSets: info.getNumSets(),
            infoRules: info.getRules(),
            infoInfo: info.getInfo(),
            infoFederation: info.getFederation(),
            //

            // Registration fields
            registrationHasCheckIn: registration.getHasCheckIn(),
            registrationStatus: registration.getStatus() as PrismaRegistrationStatus,
            registrationPeriodStartsAt: registration.getRegistrationPeriod().getStartsAt(),
            registrationPeriodEndsAt: registration.getRegistrationPeriod().getEndsAt(),
            registrationRegisteredParticipantsIds: registration.getRegisteredParticipantsIds(),
            //
        };

        return tournamentData;
    }

    // From Prisma Object to Domain Entity
    static toDomain(prismaTournament: PrismaTournament): Tournament {
        return Tournament.rehydrate({
            id: prismaTournament.id,
            name: prismaTournament.name,
            seasonStartYear: prismaTournament.seasonStartYear,
            createdAt: prismaTournament.createdAt,
            createdBy: prismaTournament.createdBy,
            status: prismaTournament.status as TournamentStatus,

            // Tournament Info
            info: {
                place: prismaTournament.infoPlace,
                dateTime: prismaTournament.infoDateTime,
                mode: prismaTournament.infoMode as GameModes,
                game: prismaTournament.infoGame,
                schedule: prismaTournament.infoSchedule as ScheduleTypes,
                maxPlayers: prismaTournament.infoMaxPlayers,
                gameType: prismaTournament.infoGameType as GameTypes,
                numLegs: prismaTournament.infoNumLegs,
                numSets: prismaTournament.infoNumSets,
                rules: prismaTournament.infoRules,
                info: prismaTournament.infoInfo,
                federation: prismaTournament.infoFederation,
            },

            // Registration
            registration: {
                hasCheckIn: prismaTournament.registrationHasCheckIn,
                status: prismaTournament.registrationStatus as RegistrationStatus,
                registrationPeriod: {
                    startsAt: prismaTournament.registrationPeriodStartsAt,
                    endsAt: prismaTournament.registrationPeriodEndsAt,
                },
                registeredParticipantsIds: prismaTournament.registrationRegisteredParticipantsIds || []
            },
        });
    }
}
